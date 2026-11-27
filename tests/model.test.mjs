import test from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../lib/relay/model.ts',import.meta.url),'utf8');
const {makeNote,flags,sample}=await import('data:text/javascript;base64,'+Buffer.from(ts.transpile(source,{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022})).toString('base64'));
test('SunoSure preserves source links and exposes meaningful omissions and conflicting ages',()=>{
 const note=makeNote(sample);assert.equal(note.observations.value,'');assert.equal(note.duration.value,'');assert.ok(flags(note,sample).some(s=>s.includes('Duration has not been documented')));
 assert.ok(flags(note,'Patient 22 years old; later 25 saal').some(s=>s.includes('two different ages')));
 assert.ok(flags(note,'Changed narrative').some(s=>s.includes('could not be matched')));
 assert.equal(makeNote('arbitrary clinical narrative').maternal.value,'');
});
