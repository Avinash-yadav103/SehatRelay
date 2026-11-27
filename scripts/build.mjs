import {spawnSync} from 'node:child_process';
function run(args,env=process.env){const result=spawnSync(process.execPath,args,{stdio:'inherit',env});if(result.status!==0)process.exit(result.status||1);}
// Database migration and real concurrency/durability checks gate hosted builds.
// Local and Docker builds remain key-free and use the file adapter.
if(process.env.VERCEL==='1'){
 if(process.env.RELAY_STORAGE!=='postgres'||!process.env.DATABASE_URL||!process.env.RELAY_SESSION_SECRET){console.error('Hosted demo needs Postgres, DATABASE_URL and RELAY_SESSION_SECRET. Build stopped before release.');process.exit(1);}
 run(['scripts/migrate-referrals.mjs']);
 run(['--test','tests/storage.test.mjs']);
}
run(['node_modules/next/dist/bin/next','build']);
