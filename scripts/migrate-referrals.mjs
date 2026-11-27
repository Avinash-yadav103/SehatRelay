import {readFile} from 'node:fs/promises';
import nextEnv from '@next/env';
import pg from 'pg';
nextEnv.loadEnvConfig(process.cwd());
if(!process.env.DATABASE_URL){console.error('DATABASE_URL is not set. Migration was not run.');process.exit(1);}
const client=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000});
try{await client.connect();await client.query('BEGIN');await client.query(await readFile(new URL('../db/migrations/001-synthetic-referrals.sql',import.meta.url),'utf8').then(text=>text.replace(/^\uFEFF/,'')));await client.query('COMMIT');console.log('Synthetic referral schema is ready.');}catch{await client.query('ROLLBACK').catch(()=>{});console.error('Migration failed. Check database connectivity and permissions; no credentials are logged.');process.exitCode=1;}finally{await client.end();}
