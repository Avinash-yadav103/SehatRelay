import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomBytes, createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { fields } from './model';
const directory = path.join(process.cwd(), '.relay-data');
const secret = process.env.RELAY_SESSION_SECRET || randomBytes(32).toString('hex');
export type Session = {workspace:string; role:'asha'|'clinician'; expires:number};
export function sign(s:Session) {const data=Buffer.from(JSON.stringify(s)).toString('base64url');return data+'.'+createHmac('sha256',secret).update(data).digest('base64url');}
export function session(token?:string):Session|null {try {const [data,mac]= (token||'').split('.');const expected=createHmac('sha256',secret).update(data).digest();const actual=Buffer.from(mac,'base64url');if(actual.length!==expected.length || !timingSafeEqual(actual,expected)) return null;const s=JSON.parse(Buffer.from(data,'base64url').toString());return /^[a-f0-9-]{36}$/.test(s.workspace)&&['asha','clinician'].includes(s.role)&&s.expires>Date.now()?s:null;}catch{return null;}}
const cell=z.object({value:z.string().max(2000),evidence:z.string().max(2000),verified:z.boolean()}).strict();
export const payload=z.object({id:z.string().uuid(),narrative:z.string().min(1).max(15000),note:z.object(Object.fromEntries(fields.map(f=>[f,cell])) as Record<typeof fields[number],typeof cell>).strict(),submit:z.boolean()}).strict();
export type RecordData=z.infer<typeof payload>&{workspace:string;status:string;timeline:{at:string;actor:string;status:string;note:string}[]};
let queue:Promise<unknown>=Promise.resolve();
export function transaction<T>(fn:(records:RecordData[])=>T|Promise<T>):Promise<T> {
 const task=queue.then(async()=>{await fs.mkdir(directory,{recursive:true});let records:RecordData[]=[];try{records=JSON.parse(await fs.readFile(path.join(directory,'records.json'),'utf8'));}catch(e:any){if(e.code!=='ENOENT')throw e;}
 const result=await fn(records);const file=path.join(directory,'records.json');await fs.writeFile(file+'.tmp',JSON.stringify(records),{mode:0o600});await fs.rename(file+'.tmp',file);return result;});queue=task.catch(()=>{});return task;
}
