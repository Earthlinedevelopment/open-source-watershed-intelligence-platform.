import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const PROD=process.env.EARTHLINE_PROD||'https://earthlinedevelopment.org/';
const CAND=process.env.EARTHLINE_CANDIDATE||'http://127.0.0.1:8787/';
const BATCH=process.env.BATCH||'drought';
const OUTDIR=process.env.OUTDIR||`out-16848-drought-${BATCH}`;
const SPECS=(process.env.TARGETS||'').split('|').map(s=>s.trim()).filter(Boolean).map(s=>{const i=s.indexOf('=');if(i<1)throw new Error('bad TARGETS item '+s);return {label:s.slice(0,i).trim(),query:s.slice(i+1).trim()};});
if(!SPECS.length)throw new Error('TARGETS required');
fs.mkdirSync(OUTDIR,{recursive:true});
const safe=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const browser=await chromium.launch({headless:true});
const rows=[];

async function captureInitial(query){
  const p=await browser.newPage({viewport:{width:1200,height:760}});let error=null,payload=null;
  try{
    await p.goto(PROD+'?drought-capture-16848='+encodeURIComponent(query)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await p.waitForFunction(()=>typeof window.geocodeMapbox==='function',{timeout:30000});
    const out=await p.evaluate(async q=>{const original=window.fetch.bind(window);let first=null;window.fetch=async(...args)=>{const r=await original(...args);try{const u=String(args[0]||'');if(u.includes('api.mapbox.com/geocoding/')&&!u.includes('types=country'))first=await r.clone().json();}catch{}return r;};let err=null;try{await geocodeMapbox(q);}catch(e){err=String(e?.message||e);}return {first,err};},query);
    if(out?.err)throw new Error(out.err);if(!out?.first?.features?.length)throw new Error('geocoder response missing');payload=out.first;
  }catch(e){error=String(e?.message||e);}await p.close();return {error,payload};
}

async function runOne(spec,capture){
  const p=await browser.newPage({viewport:{width:1700,height:900}});let harnessError=null,propertyError=null,regionalError=null,resolved=null,propertyWallMs=null;
  const started=Date.now();
  try{
    await p.goto(CAND+'?drought-property-16848='+encodeURIComponent(spec.query)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await p.waitForFunction(()=>typeof window.geocodeMapbox==='function',{timeout:30000});
    const out=await p.evaluate(async({q,payload})=>{const original=window.fetch.bind(window);window.fetch=async(url,opts)=>{const u=String(url||'');if(u.includes('api.mapbox.com/geocoding/'))return new Response(JSON.stringify(payload),{status:200,headers:{'content-type':'application/json'}});return original(url,opts);};let loc=null,err=null;try{loc=await geocodeMapbox(q);}catch(e){err=String(e?.message||e);}return {loc,err};},{q:spec.query,payload:capture.payload});
    if(out?.err)throw new Error(out.err);if(!out?.loc)throw new Error('candidate geocoder returned no location');resolved=out.loc;
    await p.evaluate(({q,loc})=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220=null;window.EARTHLINE_TEST_LOCATION_16845=Object.assign({},loc,{query:q});const i=document.getElementById('searchInput');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('runBtn').click();},{q:spec.query,loc:resolved});
    await p.waitForFunction(q=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;return !!e||(String(d?.query||'').trim().toLowerCase()===String(q).trim().toLowerCase()&&String(d?.tier||d?.mode||'').toLowerCase()==='regional');},spec.query,{timeout:95000,polling:100});
    regionalError=await p.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
    if(regionalError)throw new Error('regional precursor failed: '+JSON.stringify(regionalError));
    await p.waitForTimeout(400);
    const t=Date.now();
    await p.evaluate(()=>{window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220=null;const b=document.getElementById('earthlineDeclareProperty16169');if(!b)throw new Error('Property button missing');b.click();});
    try{await p.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,d=window.EARTHLINE_DISPLAYED_RUN_16151||null;return (a&&a.published===true&&String(d?.tier||d?.mode||'').toLowerCase()==='property')||(a&&a.published===false);},{timeout:45000,polling:100});}catch(e){propertyError=String(e?.message||e);}
    propertyWallMs=Date.now()-t;
  }catch(e){harnessError=String(e?.message||e);}
  const snap=await p.evaluate(()=>{const a=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||{},d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||{},pp=d?.propertyPublication||{},target=window.EARTHLINE_PROPERTY_TARGET_16201||{},decl=window.EARTHLINE_PROPERTY_DECLARATION_16169||{},ev=(typeof window.earthlineGetExclusionEvidence16516==='function'?window.earthlineGetExclusionEvidence16516():null)||{};return {published:a.published===true,reason:String(a.reason||''),tier:String(d?.tier||d?.mode||''),query:String(d?.query||''),engineCount:Number(a.engineCount??NaN),safeCount:Number(a.safeCount??NaN),publicationCount:Number(a.publicationCount??NaN),displayedSwales:Number(d?.derived?.swaleOpportunityLines??NaN),safetyVerified:pp.safetyVerified===true,committed:pp.committed===true,center:d?.center||null,declarationCenter:decl?.center||null,targetCenter:(Number.isFinite(Number(target?.lng))&&Number.isFinite(Number(target?.lat)))?{lng:Number(target.lng),lat:Number(target.lat)}:null,exclusionLabel:String(ev?.label||''),exclusionSourceTier:String(ev?.sourceTier||''),analysisTier:String(document.documentElement.dataset.earthlineAnalysisTier||''),propertyRunState:String(document.documentElement.dataset.earthlinePropertyRunState||'')};}).catch(()=>({}));
  const failures=[];
  if(capture.error)failures.push('geocoder capture');
  if(harnessError)failures.push('harness/regional');
  if(propertyError)failures.push('property timeout/error');
  if(!snap.published)failures.push('property not published');
  if(Number.isFinite(propertyWallMs)&&propertyWallMs>15000)failures.push('property >15s');
  if(snap.tier!=='property')failures.push('canonical tier not property');
  if(snap.committed!==true||snap.safetyVerified!==true)failures.push('property safety/commit');
  if(Number.isFinite(snap.safeCount)&&Number.isFinite(snap.publicationCount)&&snap.safeCount!==snap.publicationCount)failures.push('safe/publication mismatch');
  if(Number.isFinite(snap.displayedSwales)&&Number.isFinite(snap.publicationCount)&&snap.displayedSwales!==snap.publicationCount)failures.push('display/publication mismatch');
  const swaleGenerationPossible=snap.published===true&&Number(snap.publicationCount)>0;
  try{await p.screenshot({path:path.join(OUTDIR,`${safe(spec.label)}.jpg`),type:'jpeg',quality:45,fullPage:false});}catch{}
  const row={label:spec.label,query:spec.query,resolved:resolved?{name:resolved.name||null,placeType:resolved.placeType||null,countryCode:resolved.countryCode||null,lat:resolved.lat??null,lng:resolved.lng??null}:null,totalElapsedMs:Date.now()-started,propertyWallMs,regionalError,harnessError,propertyError,snap,swaleGenerationPossible,failures,pass:failures.length===0};
  console.log(JSON.stringify(row));await p.close();return row;
}

for(const spec of SPECS){const cap=await captureInitial(spec.query);if(cap.error){rows.push({label:spec.label,query:spec.query,captureError:cap.error,swaleGenerationPossible:false,pass:false,failures:['geocoder capture']});console.log(JSON.stringify(rows.at(-1)));continue;}rows.push(await runOne(spec,cap));}
await browser.close();
const summary={at:new Date().toISOString(),batch:BATCH,candidate:CAND,rows,technicalPass:rows.every(r=>r.pass),swalePossible:rows.filter(r=>r.swaleGenerationPossible).map(r=>r.label),swaleNotPossible:rows.filter(r=>!r.swaleGenerationPossible).map(r=>r.label)};
fs.writeFileSync(path.join(OUTDIR,'audit.json'),JSON.stringify(summary,null,2));
console.log(JSON.stringify({batch:BATCH,technicalPass:summary.technicalPass,swalePossible:summary.swalePossible,swaleNotPossible:summary.swaleNotPossible,count:rows.length}));
if(!summary.technicalPass)process.exitCode=1;
