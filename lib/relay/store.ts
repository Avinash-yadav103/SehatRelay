import 'server-only';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {Pool,type PoolClient} from 'pg';
import {z} from 'zod';
import {metric} from '@vercel/functions';
import {directory,payload,recordSchema,type RecordData} from './server';

export class StoreError extends Error{constructor(message:string,public status:number){super(message);}}
let pool:Pool|undefined;
let queue:Promise<unknown>=Promise.resolve();
function postgres(){const mode=process.env.RELAY_STORAGE||'file';if(!['file','postgres'].includes(mode))throw new StoreError('Unknown storage configuration.',503);if(process.env.VERCEL&&mode!=='postgres')throw new StoreError('Hosted storage is not configured.',503);return mode==='postgres';}
function database(){
 if(!process.env.DATABASE_URL)throw new StoreError('Database key not set. Local drafts are preserved.',503);
 if(!pool){const connectionString=process.env.DATABASE_URL;pool=new Pool({connectionString:process.env.VERCEL&&!/sslmode=/i.test(connectionString)?connectionString+(connectionString.includes('?')?'&':'?')+'sslmode=verify-full':connectionString,max:3,connectionTimeoutMillis:10000,idleTimeoutMillis:30000,allowExitOnIdle:true,statement_timeout:10000});pool.on('error',()=>{});}return pool;
}
async function measured<T>(action:'list'|'save'|'review',fn:()=>Promise<T>):Promise<T>{const start=performance.now();let outcome='error';try{const result=await fn();outcome='ok';return result;}finally{try{metric('referrals.storage',1,{action,outcome});metric('referrals.storage.duration_ms',performance.now()-start,{action});}catch{}}}
async function local<T>(write:boolean,fn:(records:RecordData[])=>T):Promise<T>{
 const task=queue.then(async()=>{await fs.mkdir(directory,{recursive:true});const file=path.join(directory,'records.json');let records:RecordData[]=[];try{records=z.array(recordSchema).parse(JSON.parse(await fs.readFile(file,'utf8')));}catch(e:any){if(e.code!=='ENOENT')throw e;}const result=fn(records);if(write){await fs.writeFile(file+'.tmp',JSON.stringify(records),{mode:0o600});await fs.rename(file+'.tmp',file);}return result;});queue=task.catch(()=>{});return task;
}
async function atomic<T>(fn:(client:PoolClient)=>Promise<T>):Promise<T>{const client=await database().connect();try{await client.query('BEGIN');const value=await fn(client);await client.query('COMMIT');return value;}catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}}
function nextRecord(workspace:string,data:z.infer<typeof payload>,old?:RecordData):RecordData{
 if(old&&old.workspace!==workspace)throw new StoreError('Record unavailable',404);
 if(old&&old.status!=='draft')return old;
 if(old&&(data.revision??0)!==old.revision)throw new StoreError('This draft changed elsewhere. Reopen the saved record before saving.',409);
 const status=data.submit?'submitted':'draft';return {...data,workspace,status,revision:(old?.revision??0)+1,timeline:[...(old?.timeline||[]),{at:new Date().toISOString(),actor:'Demo ASHA',status,note:data.submit?'Worker reviewed the note.':'Draft saved.'}]};
}
async function update(client:PoolClient,record:RecordData){await client.query('UPDATE synthetic_referrals SET status=$3,revision=$4,payload=$5,updated_at=now() WHERE id=$1 AND workspace_id=$2',[record.id,record.workspace,record.status,record.revision,JSON.stringify(record)]);}
export function listRecords(workspace:string,role:'asha'|'clinician'){return measured('list',async()=>{
 if(!postgres())return local(false,records=>records.filter(r=>r.workspace===workspace&&(role==='asha'||r.status!=='draft')));
 const result=await database().query('SELECT payload FROM synthetic_referrals WHERE workspace_id=$1 AND ($2::boolean OR status<>\'draft\') ORDER BY updated_at DESC LIMIT 200',[workspace,role==='asha']);return result.rows.map(row=>recordSchema.parse(row.payload));
});}
export function saveRecord(workspace:string,data:z.infer<typeof payload>){return measured('save',async()=>{
 if(!postgres())return local(true,records=>{const i=records.findIndex(r=>r.id===data.id);const record=nextRecord(workspace,data,records[i]);if(i<0)records.push(record);else records[i]=record;return record;});
 return atomic(async client=>{const fresh=nextRecord(workspace,data);const inserted=await client.query('INSERT INTO synthetic_referrals(id,workspace_id,status,revision,payload) VALUES($1,$2,$3,$4,$5) ON CONFLICT(id) DO NOTHING RETURNING payload',[fresh.id,workspace,fresh.status,fresh.revision,JSON.stringify(fresh)]);if(inserted.rowCount)return fresh;
  const result=await client.query('SELECT payload FROM synthetic_referrals WHERE id=$1 AND workspace_id=$2 FOR UPDATE',[data.id,workspace]);if(!result.rowCount)throw new StoreError('Record unavailable',404);const record=nextRecord(workspace,data,recordSchema.parse(result.rows[0].payload));await update(client,record);return record;
 });
});}
export type Review={id:string;status:'acknowledged'|'follow-up'|'closed';note:string;revision?:number};
function reviewed(record:RecordData|undefined,data:Review):RecordData{
 if(!record)throw new StoreError('Record unavailable',404);const allowed:Record<string,string[]>={submitted:['acknowledged'],acknowledged:['follow-up','closed'],'follow-up':['closed']};
 if(!allowed[record.status]?.includes(data.status))throw new StoreError('Invalid status transition. Refresh the list.',409);if(data.revision!==record.revision)throw new StoreError('This referral changed elsewhere. Refresh the list.',409);
 return {...record,status:data.status,revision:record.revision+1,timeline:[...record.timeline,{at:new Date().toISOString(),actor:'Demo clinician',status:data.status,note:data.note}]};
}
export function reviewRecord(workspace:string,data:Review){return measured('review',async()=>{
 if(!postgres())return local(true,records=>{const i=records.findIndex(r=>r.id===data.id&&r.workspace===workspace);const result=reviewed(records[i],data);records[i]=result;return result;});
 return atomic(async client=>{const result=await client.query('SELECT payload FROM synthetic_referrals WHERE id=$1 AND workspace_id=$2 FOR UPDATE',[data.id,workspace]);const record=reviewed(result.rowCount?recordSchema.parse(result.rows[0].payload):undefined,data);await update(client,record);return record;});
});}
