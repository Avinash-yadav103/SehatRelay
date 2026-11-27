// HTTP smoke coverage, not hydrated browser or authenticated role-flow testing.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import path from 'node:path';
const base=process.env.RELAY_TEST_URL||'http://localhost:3000';
function pages(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?pages(path.join(dir,entry.name)):entry.name==='page.tsx'?[path.join(dir,entry.name)]:[]);}
test('all existing app page routes serve and the main home exposes voice and role entry points',async()=>{
 const routes=[...new Set(pages('app').map(file=>'/'+file.replaceAll('\\','/').replace(/^app\//,'').replace(/\/?page\.tsx$/,'').replaceAll('[role]','patient')))];
 for(const route of routes){const response=await fetch(base+route);assert.equal(response.status,200,route+' should serve');}
 const html=await (await fetch(base+'/')).text();for(const text of ['Care begins with','Use microphone','/visits','/referrals','/dashboard/patient','/dashboard/doctor','Use synthetic patient information only.'])assert.ok(html.includes(text),text);
 console.log('HTTP routes checked:',routes.length);
});
