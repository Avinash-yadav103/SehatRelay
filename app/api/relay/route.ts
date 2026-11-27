import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { session, sign, payload } from '@/lib/relay/server';
import {listRecords,saveRecord,reviewRecord,StoreError} from '@/lib/relay/store';
import { fields } from '@/lib/relay/model';
import {generateStructuredNote} from '@/lib/relay/extraction.server';
import {metric} from '@vercel/functions';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest) {
 const s=session(req.cookies.get('relay-demo')?.value);if(!s)return json({error:'Choose a demo role first.'},401);
 try{return json({role:s.role,records:await listRecords(s.workspace,s.role)});}catch{return json({error:'Demo storage unavailable. Your local draft is preserved.'},503);}
}
export async function POST(req:NextRequest) {
 if(req.headers.get('origin')!==req.nextUrl.origin)return json({error:'Origin rejected'},403);
 if(Number(req.headers.get('content-length')||0)>100000)return json({error:'Request too large'},413);
 try {
 const text=await req.text();if(text.length>100000)return json({error:'Request too large'},413);const body=z.object({action:z.enum(['session','generate','save','review'])}).passthrough().parse(JSON.parse(text));
 const s=session(req.cookies.get('relay-demo')?.value);
 if(body.action==='session') {
 const role=z.enum(['asha','clinician']).parse(body.role);
 const response=json({role});response.cookies.set('relay-demo',sign({workspace:s?.workspace||randomUUID(),role,expires:Date.now()+86400000}),{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:86400});return response;
 }
 if(!s)return json({error:'Choose a demo role first.'},401);
 if(body.action==='generate') {if(s.role!=='asha')return json({error:'ASHA role required'},403);const narrative=z.string().min(1).max(15000).refine(value=>!!value.trim()).parse(body.narrative);const manual=z.boolean().optional().parse(body.manual);const started=performance.now();const result=await generateStructuredNote(narrative,{manual});try{metric('visits.extraction',1,{outcome:result.extraction.kind,code:result.error?.code||'ok'});metric('visits.extraction.duration_ms',performance.now()-started);}catch{}const {httpStatus,...data}=result;return json(data,httpStatus);}
 if(body.action==='save') {
 if(s.role!=='asha')return json({error:'ASHA role required'},403);
 const data=payload.parse(body.data);
 if(fields.some(field=>{const cell=data.note[field];return (!!cell.evidence&&(!cell.value.trim()||!data.narrative.includes(cell.evidence)||!cell.evidence.includes(cell.value)))||cell.alternatives?.some(excerpt=>!data.narrative.includes(excerpt));}))return json({error:'Source excerpts no longer match the narrative. Review and correct the note before saving.'},400);
 if(data.submit && (fields.some(f=>!data.note[f].verified)|| !data.note.facility.value.trim()||!data.note.referralReason.value.trim()||!data.note.patient.value.trim())) return json({error:'Review every field (including unknowns), and enter patient, referral reason and facility.'},400);
 return json({record:await saveRecord(s.workspace,data)});
 }
 if(body.action==='review') {
 if(s.role!=='clinician')return json({error:'Clinician role required'},403);
 const data=z.object({id:z.string().uuid(),status:z.enum(['acknowledged','follow-up','closed']),note:z.string().trim().min(1).max(2000),revision:z.number().int().nonnegative().optional()}).parse(body);
 return json({record:await reviewRecord(s.workspace,data)});
 }
 return json({error:'Unknown action'},400);
 }catch(e){if(e instanceof StoreError)return json({error:e.message},e.status);return json({error:e instanceof z.ZodError?'Invalid request fields.':e instanceof SyntaxError?'Invalid JSON.':'Could not save. Keep your draft and retry.'},e instanceof z.ZodError||e instanceof SyntaxError?400:503);}
}
