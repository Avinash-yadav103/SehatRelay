// Load isolated TS server modules for Node tests without bundling the Next app.
// server-only is a Next build guard; it is deliberately a no-op in these server tests.
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import path from 'node:path';
import ts from 'typescript';
const require=createRequire(import.meta.url);
const cache=new Map();
export function loadServerModule(file){
 const absolute=path.resolve(file);if(cache.has(absolute))return cache.get(absolute).exports;
 const module={exports:{}};cache.set(absolute,module);
 const code=ts.transpileModule(readFileSync(absolute,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 const localRequire=specifier=>{if(specifier==='server-only')return {};if(specifier.startsWith('.')){const resolved=path.resolve(path.dirname(absolute),specifier);return loadServerModule(existsSync(resolved)?resolved:resolved+'.ts');}return require(specifier);};
 new Function('require','module','exports',code)(localRequire,module,module.exports);return module.exports;
}
