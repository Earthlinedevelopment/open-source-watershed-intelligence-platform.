import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const srcPath='lab/launch-matrix.mjs';
const outPath='lab/.hawaii-state-runtime.mjs';
let src=await fs.readFile(srcPath,'utf8');
const oldTests='const TESTS=SOURCE.filter((_,i)=>i%SHARD_TOTAL===SHARD_INDEX);';
if(!src.includes(oldTests))throw new Error('launch-matrix TESTS selector missing');
src=src.replace(oldTests,"const TESTS=['Hawaii'];");
const oldSnap="diagnosticVisible,statusText:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,700),runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true'";
const newSnap=`diagnosticVisible,statusText:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1400),runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true',\n    locDetail:m&&m.loc?{name:m.loc.name,lat:m.loc.lat,lng:m.loc.lng,bbox:m.loc.bbox,analysisBBox:m.loc.analysisBBox,extentClass:m.loc.extentClass,placeType:m.loc.placeType,countryCode:m.loc.countryCode}:null,\n    atomicPackage:window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556?{profileId:window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556.profileId,center:window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556.center,regionalExtent:window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556.regionalExtent,identity:window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556.identity}:null,\n    landValidity:window.EARTHLINE_LAND_VALIDITY_16584||null,\n    landGrid:window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null,\n    flowAudit:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,\n    preflight:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null,\n    terminal:window.EARTHLINE_REGIONAL_TERMINAL_16539||null,\n    cameraAudit:window.EARTHLINE_REGIONAL_CAMERA_AUDIT_16147||null,\n    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null`;
if(!src.includes(oldSnap))throw new Error('launch-matrix snapshot target missing');
src=src.replace(oldSnap,newSnap);
src=src.replace("const out=`lab-results/regional-${AREA.toLowerCase()}-${SHARD_INDEX}-of-${SHARD_TOTAL}.json`;","const out='lab-results/hawaii-state-diagnostic.json';");
src=src.replace("console.log('EARTHLINE_REGIONAL_MATRIX '+JSON.stringify(report));","console.log('EARTHLINE_HAWAII_DIAGNOSTIC '+JSON.stringify(report));");
await fs.writeFile(outPath,src);
await import(pathToFileURL(process.cwd()+'/'+outPath).href+'?diag='+Date.now());
