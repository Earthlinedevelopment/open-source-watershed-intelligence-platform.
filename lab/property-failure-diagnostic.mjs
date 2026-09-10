import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const srcPath='lab/global-country-matrix.mjs';
const outPath='lab/.property-failure-runtime.mjs';
let src=await fs.readFile(srcPath,'utf8');
const oldTests='const TESTS=COUNTRIES.filter((_,i)=>i%SHARD_TOTAL===SHARD_INDEX);';
const names=['Tuvalu','New Zealand','Gambia','Marshall Islands','Laos'];
const newTests=`const TESTS=COUNTRIES.filter(c=>${JSON.stringify(names)}.includes(c.name));`;
if(!src.includes(oldTests))throw new Error('TESTS selector missing');
src=src.replace(oldTests,newTests);
const oldSnap="status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1200)";
const newSnap=oldSnap+`,\n    propertyStage:window.EARTHLINE_PROPERTY_ACTIVE_STAGE_16178||null,\n    propertyPhaseTrace:window.EARTHLINE_PROPERTY_PHASE_TRACE_16319||null,\n    propertyLaunchAudit:window.EARTHLINE_PROPERTY_LAUNCH_AUDIT_16322||null,\n    landGrid:window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null,\n    flowAudit:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null`;
if(!src.includes(oldSnap))throw new Error('snap target missing');
src=src.replace(oldSnap,newSnap);
await fs.writeFile(outPath,src);
await import(pathToFileURL(process.cwd()+'/'+outPath).href+'?r='+Date.now());
