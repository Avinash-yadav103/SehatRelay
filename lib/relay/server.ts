import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {randomBytes,createHmac,timingSafeEqual} from 'node:crypto';
import {z} from 'zod';
import {fields} from './model';
export const directory=process.env.RELAY_DATA_DIR||path.join(process.cwd(),'.relay-data');
let cachedSecret:string|undefined;
function secret(){
 if(process.env.RELAY_SESSION_SECRET)return process.env.RELAY_SESSION_SECRET;
 if(process.env.VERCEL)throw new Error('Hosted demo requires RELAY_SESSION_SECRET');
 if(!cachedSecret){mkdirSync(directory,{recursive:true});const file=path.join(directory,'session.key');try{writeFileSync(file,randomBytes(32).toString('hex'),{flag:'wx',mode:0o600});}catch(e:any){if(e.code!=='EEXIST')throw e;}cachedSecret=readFileSync(file,'utf8');}
 return cachedSecret;
}
export type Session={workspace:string;role:'asha'|'clinician';expires:number};
export function sign(s:Session){const data=Buffer.from(JSON.stringify(s)).toString('base64url');return data+'.'+createHmac('sha256',secret()).update(data).digest('base64url');}
export function session(token?:string):Session|null{try{const [data,mac]=(token||'').split('.');const expected=createHmac('sha256',secret()).update(data).digest();const actual=Buffer.from(mac,'base64url');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return null;const s=JSON.parse(Buffer.from(data,'base64url').toString());return /^[a-f0-9-]{36}$/.test(s.workspace)&&['asha','clinician'].includes(s.role)&&s.expires>Date.now()?s:null;}catch{return null;}}
const cell=z.object({value:z.string().max(2000),evidence:z.string().max(2000),verified:z.boolean(),reviewReason:z.string().max(400).optional(),alternatives:z.array(z.string().min(1).max(2000)).max(6).optional()}).strict();
export const payload=z.object({id:z.string().uuid(),narrative:z.string().min(1).max(15000).refine(value=>!!value.trim(),'Narrative is required'),note:z.object(Object.fromEntries(fields.map(f=>[f,cell])) as Record<typeof fields[number],typeof cell>).strict(),submit:z.boolean(),revision:z.number().int().nonnegative().optional(),extraction:z.object({kind:z.enum(['ai','manual','fixture']),message:z.string().max(600)}).strict().optional()}).strict();
export const recordSchema=payload.extend({workspace:z.string().uuid(),status:z.enum(['draft','submitted','acknowledged','follow-up','closed']),revision:z.number().int().nonnegative().default(0),timeline:z.array(z.object({at:z.string().datetime(),actor:z.string(),status:z.string(),note:z.string()}))});
export type RecordData=z.infer<typeof recordSchema>;
