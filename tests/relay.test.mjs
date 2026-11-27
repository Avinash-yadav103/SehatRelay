// Run against npm run dev or npm start: node --test tests/relay.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
const base=process.env.RELAY_TEST_URL||'http://localhost:3000';
let cookie='';
async function call(body, token=cookie){const r=await fetch(base+'/api/relay',{method:body?'POST':'GET',headers:{origin:base,'content-type':'application/json',cookie:token},body:body?JSON.stringify(body):undefined});const c=r.headers.get('set-cookie');if(c)cookie=c.split(';')[0];return {status:r.status,data:await r.json()};}
test('synthetic handoff: auth, validation, extraction, persistence, duplicate and transition guards',async()=>{
 assert.equal((await call(null,'')).status,401);
 assert.equal((await call({action:'session',role:'admin'})).status,400);
 assert.equal((await call({action:'session',role:'asha'})).status,200);
 const asha=cookie;
 assert.equal((await call({action:'generate',narrative:'   '})).status,400);
 const manualTemplate=await call({action:'generate',narrative:'Synthetic visit',manual:true});assert.equal(manualTemplate.status,200);assert.equal(manualTemplate.data.extraction.kind,'manual');
 const sample='Demo patient Tara-01. Aaj pregnancy follow-up visit hai. Patient ne thakan batayi. Pregnancy 24 weeks hai. Clinician review ke liye referral chahiye.';
 const generated=await call({action:'generate',narrative:sample});assert.equal(generated.status,200);const note=generated.data.note;assert.equal(note.duration.value,'');assert.ok(sample.includes(note.symptoms.evidence));
 const manual=await call({action:'generate',narrative:'कुछ अलग / arbitrary narrative'});assert.equal(manual.data.note.symptoms.value,'');assert.match(manual.data.mode,/Manual/);
 const data={id:crypto.randomUUID(),narrative:sample,note,submit:false};
 const draft=await call({action:'save',data});assert.equal(draft.status,200);data.revision=draft.data.record.revision;
 data.submit=true;assert.equal((await call({action:'save',data})).status,400);
 for(const field of Object.values(note))field.verified=true;
 note.patient.value='Fictional Tara-01';note.patient.evidence='';note.facility.value='Demo PHC';note.referralReason.value='Worker requested clinician review';note.referralReason.evidence='';
 note.maternal.reviewReason='Potential conflict reviewed manually in this synthetic test.';note.maternal.alternatives=['Pregnancy 24 weeks hai'];
 const invalid=structuredClone(data);invalid.note.symptoms.evidence='not in the source';assert.equal((await call({action:'save',data:invalid})).status,400);
 const wrongValue=structuredClone(data);wrongValue.note.symptoms.value='invented detail';assert.equal((await call({action:'save',data:wrongValue})).status,400);
 const submitted=await call({action:'save',data});assert.equal(submitted.data.record.status,'submitted');data.revision=submitted.data.record.revision;
 await call({action:'save',data});assert.equal((await call()).data.records.filter(r=>r.id===data.id).length,1);
 assert.equal((await call({action:'review',id:data.id,status:'acknowledged',note:'Reviewed'})).status,403);
 await call({action:'session',role:'clinician'});
 assert.equal((await call({action:'save',data})).status,403);
 assert.equal((await call({action:'review',id:data.id,status:'closed',note:'Reviewed'})).status,409);
 assert.equal((await call({action:'review',id:data.id,status:'acknowledged',note:'Synthetic source and note reviewed.',revision:data.revision})).data.record.status,'acknowledged');
 const persisted=(await call()).data.records.find(r=>r.id===data.id);assert.equal(persisted.timeline.at(-1).actor,'Demo clinician');assert.deepEqual(persisted.note.maternal.alternatives,['Pregnancy 24 weeks hai']);assert.match(persisted.note.maternal.reviewReason,/reviewed manually/);
 await call({action:'session',role:'asha'},'');assert.equal((await call()).data.records.length,0);
 assert.equal((await call({action:'save',data})).status,404);
 assert.equal((await call(null,asha)).data.records.find(r=>r.id===data.id).status,'acknowledged');
});
