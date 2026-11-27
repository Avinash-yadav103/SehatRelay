import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {loadServerModule} from './server-loader.mjs';
const {generateStructuredNote,validateExtraction}=loadServerModule('lib/relay/extraction.server.ts');
const {fields,flags,resetForNarrativeEdit}=loadServerModule('lib/relay/model.ts');
const {syntheticExamples}=loadServerModule('lib/relay/examples.ts');
function output(values,issues=[]){return {fields:Object.fromEntries(fields.map(field=>[field,values[field]?{value:values[field],evidence:values[field]}:{value:null,evidence:null}])),issues};}
// These are MOCK provider outputs, not results from a language model.
const fixtures=[
 output({patient:'Mina-02',date:'2026-11-28',language:'English',reason:'pregnancy follow-up visit',symptoms:'headache',duration:'two days',maternal:'20 weeks',referralReason:'clinician review',facility:'Demo PHC'}),
 output({patient:'रीवा-03',date:'28 नवंबर 2026',language:'हिंदी',reason:'गर्भावस्था की नियमित मुलाकात',symptoms:'थकान',duration:'तीन दिनों',maternal:'22 सप्ताह',observations:'110/70 mmHg',referralReason:'चिकित्सक द्वारा समीक्षा',facility:'डेमो पीएचसी'}),
 output({patient:'Nila-04',date:'2026-11-28',language:'Hinglish',reason:'Pregnancy follow-up visit',symptoms:'nausea',referralReason:'clinician review',facility:'Demo PHC',followUp:'Friday ko referral status check karna'},[{field:'maternal',kind:'conflicting',excerpts:['24 weeks','26 weeks']}]),
];
const narratives=syntheticExamples.slice(1).map(example=>example.narrative);
test('structured HTTP adapter: three new fictional English/Hindi/Hinglish visits, omissions and conflict',async()=>{
 const requests=[];
 const server=createServer(async(req,res)=>{
  let text='';for await(const chunk of req)text+=chunk;
  const body=JSON.parse(text);requests.push({body,authorization:req.headers.authorization});
  if(req.url==='/failure'){res.writeHead(503);res.end('Sensitive provider diagnostics MUST NOT be exposed');return;}
  if(req.url==='/timeout')return;
  if(req.url==='/oversized'){res.writeHead(200,{'Content-Length':'300000'});res.end();return;}
  if(req.url==='/bad-json'){res.end('{broken');return;}
  if(req.url==='/refusal'){res.end(JSON.stringify({choices:[{message:{refusal:'provider refusal'},finish_reason:'stop'}]}));return;}
  const narrative=JSON.parse(body.messages[1].content).narrative;
  const index=narratives.indexOf(narrative);const data=structuredClone(fixtures[Math.max(0,index)]);
  if(req.url==='/invalid')data.fields.observations={value:'120/80 mmHg',evidence:'headache'};
  if(req.url==='/bad-schema')data.fields.symptoms.verified=true;
  if(req.url==='/truncated'){res.end(JSON.stringify({choices:[{message:{content:JSON.stringify(data)},finish_reason:'length'}]}));return;}
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:JSON.stringify(data)},finish_reason:'stop'}]}));
 });server.listen(0,'127.0.0.1');await once(server,'listening');
 const base=`http://127.0.0.1:${server.address().port}`;
 const env={NODE_ENV:'test',SEHAT_AI_PROVIDER:'openai-compatible',SEHAT_AI_API_KEY:'test-only-key',SEHAT_AI_ENDPOINT:base+'/valid',SEHAT_AI_MODEL:'mock-structured-model',SEHAT_AI_ALLOW_LOCAL_HTTP:'1'};
 try{
  for(let i=0;i<narratives.length;i++){
   const original=narratives[i];const generated=await generateStructuredNote(original,{env});assert.equal(generated.httpStatus,200);assert.equal(generated.extraction.kind,'ai');assert.equal(narratives[i],original);
   assert.equal(generated.note.patient.value,fixtures[i].fields.patient.value);assert.equal(generated.note.history.value,'');
   for(const field of fields){assert.equal(generated.note[field].verified,false);if(generated.note[field].value){assert.ok(original.includes(generated.note[field].evidence));assert.ok(generated.note[field].evidence.includes(generated.note[field].value));}}
   const request=requests.at(-1);assert.equal(request.authorization,'Bearer test-only-key');assert.equal(request.body.response_format.type,'json_schema');assert.equal(request.body.response_format.json_schema.strict,true);assert.equal(JSON.parse(request.body.messages[1].content).narrative,original);assert.match(request.body.messages[0].content,/untrusted/);
   if(i===1)assert.equal(generated.note.date.value,'28 नवंबर 2026');
   if(i===2){assert.equal(generated.note.duration.value,'');assert.equal(generated.note.maternal.value,'');assert.deepEqual(generated.note.maternal.alternatives,['24 weeks','26 weeks']);assert.ok(flags(generated.note,original).some(flag=>flag.includes('conflicting')));}
  }
  for(const [endpoint,code,status]of [['invalid','AI_OUTPUT_INVALID',502],['bad-schema','AI_OUTPUT_INVALID',502],['bad-json','AI_OUTPUT_INVALID',502],['truncated','AI_OUTPUT_INVALID',502],['failure','AI_UNAVAILABLE',503],['refusal','AI_REFUSED',422],['oversized','AI_OUTPUT_INVALID',502],['timeout','AI_TIMEOUT',504]]){
   const result=await generateStructuredNote(narratives[0],{env:{...env,SEHAT_AI_ENDPOINT:base+'/'+endpoint,SEHAT_AI_TIMEOUT_MS:endpoint==='timeout'?'50':'15000'}});assert.equal(result.error.code,code,endpoint);assert.equal(result.httpStatus,status,endpoint);assert.equal(result.extraction.kind,'manual');assert.ok(fields.every(field=>result.note[field].value===''&&!result.note[field].verified));assert.ok(!JSON.stringify(result).includes('test-only-key'));assert.ok(!JSON.stringify(result).includes('Sensitive provider diagnostics'));
  }
  const count=requests.length;const manual=await generateStructuredNote(narratives[0],{env,manual:true});assert.equal(requests.length,count);assert.equal(manual.extraction.kind,'manual');
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
});
test('configuration, network errors, exact-source enforcement and review reset fail safely',async()=>{
 const noConfig=await generateStructuredNote(narratives[0],{env:{}});assert.equal(noConfig.error.code,'AI_NOT_CONFIGURED');assert.equal(noConfig.extraction.kind,'manual');
 const missing=await generateStructuredNote(narratives[0],{env:{SEHAT_AI_PROVIDER:'gateway'}});assert.equal(missing.error.code,'AI_NOT_CONFIGURED');
 const invalid=await generateStructuredNote(narratives[0],{env:{NODE_ENV:'production',SEHAT_AI_PROVIDER:'openai-compatible',SEHAT_AI_API_KEY:'test',SEHAT_AI_MODEL:'mock',SEHAT_AI_ENDPOINT:'http://127.0.0.1/unsafe'}});assert.equal(invalid.error.code,'AI_CONFIG_INVALID');
 const failed=await generateStructuredNote(narratives[0],{env:{SEHAT_AI_PROVIDER:'gateway',AI_GATEWAY_API_KEY:'test',SEHAT_AI_MODEL:'mock'},fetch:async()=>{throw new Error('private error');}});assert.equal(failed.error.code,'AI_UNAVAILABLE');assert.ok(!JSON.stringify(failed).includes('private error'));
 const translated=structuredClone(fixtures[1]);translated.fields.symptoms={value:'fatigue',evidence:'थकान'};assert.throws(()=>validateExtraction(translated,narratives[1]),/verbatim source/);
 const invented=structuredClone(fixtures[0]);invented.fields.observations={value:'120/80',evidence:'120/80'};assert.throws(()=>validateExtraction(invented,narratives[0]),/source evidence/);
 const badIssue=structuredClone(fixtures[2]);badIssue.issues[0].excerpts=['24 weeks','imagined text'];assert.throws(()=>validateExtraction(badIssue,narratives[2]),/source excerpts/);
 const note=validateExtraction(fixtures[0],narratives[0]);for(const field of fields)note[field].verified=true;const reset=resetForNarrativeEdit(note);assert.ok(fields.every(field=>!reset[field].verified&&!reset[field].evidence));assert.equal(reset.symptoms.value,'headache');
});
