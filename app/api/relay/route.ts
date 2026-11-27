import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { session, sign, transaction, payload } from '@/lib/relay/server';
import { fields, makeNote, sample } from '@/lib/relay/model';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(req:NextRequest) {
 const s=session(req.cookies.get('relay-demo')?.value);if(!s)return json({error:'Choose a demo role first.'},401);
 try{return await transaction(records=>json({role:s.role,records:records.filter(r=>r.workspace===s.workspace&&(s.role==='asha'||r.status!=='draft'))}));}catch{return json({error:'Demo storage unavailable. Your local draft is preserved.'},503);}
}
export async function POST(req:NextRequest) {
 if(req.headers.get('origin')!==req.nextUrl.origin)return json({error:'Origin rejected'},403);
 if(Number(req.headers.get('content-length')||0)>100000)return json({error:'Request too large'},413);
 try {
 const text=await req.text();if(text.length>100000)return json({error:'Request too large'},413);const body=JSON.parse(text);
 const s=session(req.cookies.get('relay-demo')?.value);
 if(body.action==='session') {
 const role=z.enum(['asha','clinician']).parse(body.role);
 const response=json({role});response.cookies.set('relay-demo',sign({workspace:s?.workspace||randomUUID(),role,expires:Date.now()+86400000}),{httpOnly:true,sameSite:'strict',secure:process.env.NODE_ENV==='production',path:'/',maxAge:86400});return response;
 }
 if(!s)return json({error:'Choose a demo role first.'},401);
 if(body.action==='generate') {if(s.role!=='asha')return json({error:'ASHA role required'},403);const narrative=z.string().min(1).max(15000).parse(body.narrative);return json({note:makeNote(narrative),mode:narrative===sample?'Predefined synthetic example. Review every field.':'Manual template: no AI provider configured. Enter fields from the narrative.'});}
 if(body.action==='save') {
 if(s.role!=='asha')return json({error:'ASHA role required'},403);
 const data=payload.parse(body.data);
 if(data.submit && (fields.some(f=>!data.note[f].verified)|| !data.note.facility.value.trim()||!data.note.referralReason.value.trim()||!data.note.patient.value.trim())) return json({error:'Review every field (including unknowns), and enter patient, referral reason and facility.'},400);
 return await transaction(records=>{const old=records.find(r=>r.id===data.id);if(old&&old.workspace!==s.workspace)return json({error:'Record unavailable'},404);if(old&&old.status!=='draft')return json({record:old});const record={...data,workspace:s.workspace,status:data.submit?'submitted':'draft',timeline:[...(old?.timeline||[]),{at:new Date().toISOString(),actor:'Demo ASHA',status:data.submit?'submitted':'draft',note:data.submit?'Worker reviewed the note.':'Draft saved.'}]};if(old) records.splice(records.indexOf(old),1,record);else records.push(record);return json({record});});
 }
 if(body.action==='review') {
 if(s.role!=='clinician')return json({error:'Clinician role required'},403);
 const data=z.object({id:z.string().uuid(),status:z.enum(['acknowledged','follow-up','closed']),note:z.string().trim().min(1).max(2000)}).parse(body);
 return await transaction(records=>{const r=records.find(r=>r.id===data.id&&r.workspace===s.workspace);if(!r)return json({error:'Record unavailable'},404);const allowed:Record<string,string[]>={submitted:['acknowledged'],acknowledged:['follow-up','closed'],'follow-up':['closed']};if(!allowed[r.status]?.includes(data.status))return json({error:'Invalid status transition. Refresh the list.'},409);r.status=data.status;r.timeline.push({at:new Date().toISOString(),actor:'Demo clinician',status:data.status,note:data.note});return json({record:r});});
 }
 return json({error:'Unknown action'},400);
 }catch(e){return json({error:e instanceof z.ZodError?'Invalid request fields.':e instanceof SyntaxError?'Invalid JSON.':'Could not save. Keep your draft and retry.'},e instanceof z.ZodError||e instanceof SyntaxError?400:503);}
}
