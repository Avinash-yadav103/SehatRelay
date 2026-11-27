// File mode: node --test tests/storage.test.mjs
// Real configured Postgres: RELAY_STORAGE=postgres node --test tests/storage.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import nextEnv from '@next/env';
import {loadServerModule} from './server-loader.mjs';
nextEnv.loadEnvConfig(process.cwd());
const pg=process.env.RELAY_STORAGE==='postgres';
if(!pg){process.env.RELAY_STORAGE='file';process.env.RELAY_DATA_DIR=path.join(process.cwd(),'.relay-data','storage-test-'+crypto.randomUUID());await mkdir(process.env.RELAY_DATA_DIR,{recursive:true});}
const store=loadServerModule('lib/relay/store.ts');
const {makeNote}=loadServerModule('lib/relay/model.ts');
test(`persistent synthetic referrals (${pg?'REAL Postgres':'local file'}): concurrent updates, isolation, timeline, independent process`,async()=>{
 const workspace=crypto.randomUUID();const other=crypto.randomUUID();
 const input={id:crypto.randomUUID(),narrative:'Fictional persistence test only.',note:makeNote(''),submit:false};
 let record=await store.saveRecord(workspace,input);assert.equal(record.revision,1);
 assert.equal((await store.listRecords(workspace,'clinician')).length,0);
 const contenders=await Promise.allSettled([store.saveRecord(workspace,{...input,revision:1}),store.saveRecord(workspace,{...input,revision:1})]);
 assert.equal(contenders.filter(r=>r.status==='fulfilled').length,1);assert.equal(contenders.find(r=>r.status==='rejected').reason.status,409);
 record=(await store.listRecords(workspace,'asha'))[0];assert.equal(record.revision,2);
 const submit={...input,submit:true,revision:record.revision};
 const [a,b]=await Promise.all([store.saveRecord(workspace,submit),store.saveRecord(workspace,submit)]);
 assert.equal(a.revision,b.revision);assert.equal(a.timeline.filter(e=>e.status==='submitted').length,1);
 await assert.rejects(store.saveRecord(other,submit),e=>e.status===404);
 assert.equal((await store.listRecords(other,'clinician')).length,0);
 await assert.rejects(store.reviewRecord(workspace,{id:input.id,status:'closed',note:'Synthetic',revision:a.revision}),e=>e.status===409);
 const ack=await store.reviewRecord(workspace,{id:input.id,status:'acknowledged',note:'Synthetic source reviewed.',revision:a.revision});
 assert.equal(ack.timeline.at(-1).actor,'Demo clinician');
 await assert.rejects(store.reviewRecord(workspace,{id:input.id,status:'follow-up',note:'Stale',revision:a.revision}),e=>e.status===409);
 const script=`import {loadServerModule} from './tests/server-loader.mjs';const s=loadServerModule('lib/relay/store.ts');const rows=await s.listRecords('${workspace}','asha');console.log(JSON.stringify(rows.map(r=>({id:r.id,status:r.status,revision:r.revision,timeline:r.timeline.length}))));`;
 const child=await promisify(execFile)(process.execPath,['--input-type=module','-e',script],{cwd:process.cwd(),env:process.env,timeout:30000});
 const rows=JSON.parse(child.stdout.trim());assert.equal(rows[0].status,'acknowledged');assert.equal(rows[0].revision,ack.revision);assert.equal(rows[0].timeline,ack.timeline.length);
 const follow=await store.reviewRecord(workspace,{id:input.id,status:'follow-up',note:'Synthetic follow-up.',revision:ack.revision});
 const closed=await store.reviewRecord(workspace,{id:input.id,status:'closed',note:'Synthetic complete.',revision:follow.revision});assert.equal(closed.status,'closed');
});
