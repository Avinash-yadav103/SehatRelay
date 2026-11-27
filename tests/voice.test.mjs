import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../lib/voice/session.ts',import.meta.url),'utf8');
const {createVoiceSession,insertDictation,navigationCommand}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(source,{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
class FakeRecognition{
 lang='';continuous=false;interimResults=false;onstart=null;onend=null;onerror=null;onresult=null;starts=0;stops=0;aborts=0;
 start(){this.starts++;}stop(){this.stops++;this.onend?.();}abort(){this.aborts++;}
}
const result=(text,final=true)=>({isFinal:final,0:{transcript:text}});
test('SpeechRecognition adapter waits for start, deduplicates revised results, and stages final text after stop',()=>{
 const engine=new FakeRecognition(),states=[];const session=createVoiceSession(()=>engine,s=>states.push(s));
 session.start('hi-IN');assert.equal(states.at(-1).phase,'requesting');assert.equal(engine.lang,'hi-IN');assert.ok(engine.continuous&&engine.interimResults);
 engine.onstart();assert.equal(states.at(-1).phase,'recording');
 engine.onresult({results:[result('नमस्ते',true),result('draft',false)]});assert.equal(states.at(-1).interim,'draft');
 engine.onresult({results:[result('नमस्ते',true),result('visit updated',true)]});assert.equal(states.at(-1).transcript,'नमस्ते visit updated');
 session.stop();assert.equal(engine.stops,1);assert.equal(states.at(-1).phase,'review');assert.equal(states.at(-1).transcript,'नमस्ते visit updated');assert.equal(engine.onresult,null);session.dispose();
});
test('cancel and dispose abort capture and ignore late callbacks',()=>{
 const engine=new FakeRecognition(),states=[];const session=createVoiceSession(()=>engine,s=>states.push(s));session.start('en-IN');const late=engine.onresult;
 session.cancel();late({results:[result('late text')]});assert.equal(states.at(-1).phase,'ready');assert.equal(states.at(-1).transcript,'');assert.equal(engine.aborts,1);
 session.start('en-IN');const callback=engine.onstart;const length=states.length;session.dispose();callback();assert.equal(states.length,length);assert.equal(engine.onstart,null);
});
test('denial, network failure, empty final results and constructor errors stay explicit',()=>{
 for(const code of ['not-allowed','network','audio-capture']){const engine=new FakeRecognition(),states=[];const session=createVoiceSession(()=>engine,s=>states.push(s));session.start('en-IN');const end=engine.onend;engine.onerror({error:code});end();assert.equal(states.at(-1).phase,'error');assert.match(states.at(-1).error,/permission|connect|microphone/i);assert.ok(engine.aborts);session.dispose();}
 const engine=new FakeRecognition(),states=[];const session=createVoiceSession(()=>engine,s=>states.push(s));session.start('en-IN');engine.onresult({results:[result('interim only',false)]});engine.onend();assert.equal(states.at(-1).phase,'error');assert.equal(states.at(-1).transcript,'');session.dispose();
 const failed=[];const bad=createVoiceSession(()=>{throw new Error('unsupported');},s=>failed.push(s));bad.start('en-IN');assert.equal(failed.at(-1).phase,'error');bad.dispose();
});
test('reviewed insertion preserves surrounding text, selection and Unicode and respects length limits',()=>{
 assert.deepEqual(insertDictation('Before after',7,7,'patient visit'),{value:'Before patient visit after',caret:21});
 assert.equal(insertDictation('Old word remains',4,8,'नई बात').value,'Old नई बात remains');
 assert.throws(()=>insertDictation('abc',3,3,'too much',5),/field limit/);
 assert.equal(insertDictation('',0,0,'नमस्ते').value,'नमस्ते');
});

test('navigation accepts only fixed destinations and rejects arbitrary instructions',()=>{assert.deepEqual(navigationCommand(' Open Visits! '),{label:'Voice visits',href:'/visits'});assert.equal(navigationCommand('submit this referral'),null);assert.equal(navigationCommand('open https://evil.example'),null);assert.equal(navigationCommand('__proto__'),null);assert.equal(navigationCommand('open dashboard').href,'/dashboard');});
