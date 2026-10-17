import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const index=readFileSync('index.html','utf8');
const launch=readFileSync('earthline-launch-16872.js','utf8');
const css=readFileSync('earthline-launch-16872.css','utf8');
const elder=readFileSync('earthline-elder-worker-17129.js','utf8');
const detector=readFileSync('tools/elder_trees/chmv2_array_detector_17129.py','utf8');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1800,height:950}});
await context.route('https://earthlinedevelopment.org/**',async route=>{
  const req=route.request(),u=new URL(req.url());
  if(req.resourceType()==='document'&&u.pathname==='/')return route.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  if(u.pathname==='/earthline-launch-16872.js')return route.fulfill({status:200,body:launch,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  if(u.pathname==='/earthline-launch-16872.css')return route.fulfill({status:200,body:css,headers:{'content-type':'text/css; charset=utf-8','cache-control':'no-store'}});
  if(u.pathname==='/earthline-elder-worker-17129.js')return route.fulfill({status:200,body:elder,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  if(u.pathname==='/tools/elder_trees/chmv2_array_detector_17129.py')return route.fulfill({status:200,body:detector,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
  return route.continue();
});
const page=await context.newPage();
await page.goto('https://earthlinedevelopment.org/?mexicoParentProof17429='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForFunction(()=>typeof window.earthlineDeclarePropertyAtCrosshair16173==='function'&&typeof window.earthlineSelectedSiteFromCenter==='function'&&typeof window.applyLocation==='function',null,{timeout:45000,polling:100});

const fixedParent={
  q:'Mexico',name:'Mexico',fullName:'Mexico',label:'Mexico',
  country:'Mexico',countryCode:'mx',placeType:'country',
  lat:23.6345,lng:-102.5528,precipIn:30,runC:.35,elevM:0,
  planning:false,regionalMode:true,propertyMode:false
};
const seq=[['A1',-95.74612,16.68512],['B',-95.75225,16.68527],['A2',-95.74612,16.68512]];
const hash=v=>createHash('sha256').update(String(v)).digest('hex');
const canon=fs=>JSON.stringify((fs||[]).map((f,i)=>({id:String(f?.id??f?.properties?.id??f?.properties?.rawIndex??i),g:f?.geometry||null})).sort((a,b)=>a.id.localeCompare(b.id)));
const rows=[];
for(const [name,lng,lat] of seq){
  const prep=await page.evaluate(async ({parent,lng,lat})=>{
    const m=(typeof M!=='undefined'&&M)||window.M;
    // Proof-only: rebuild each selected site from the exact same non-Property parent.
    const site=window.earthlineSelectedSiteFromCenter(parent,lng,lat,20);
    const applied=await window.applyLocation(site,null,m.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false,reason:'apply'};
    await new Promise(r=>setTimeout(r,900));
    window.earthlineSetPropertyTarget16201({lng,lat,source:'parent-proof-17429'},{openPanel:false});
    // Reset M.loc to the same geographic parent before terminal declaredSite() runs.
    m.loc=JSON.parse(JSON.stringify(parent));
    m.centerLng=lng;m.centerLat=lat;
    return {ok:true,loc:m.loc,target:window.EARTHLINE_PROPERTY_TARGET_16201};
  },{parent:fixedParent,lng,lat});
  const out=await page.evaluate(async()=>{
    try{return {ok:(await window.earthlineDeclarePropertyAtCrosshair16173())!==false}}catch(e){return {ok:false,error:String(e)}}
  });
  await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.scientificSettled===true,null,{timeout:60000,polling:100}).catch(()=>{});
  const snap=await page.evaluate(()=>{
    const m=(typeof M!=='undefined'&&M)||window.M;
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    const safe=m?.authoritativeSafeSwales15815?.features||[];
    return {count:safe.length,corridors:Number(a.corridors??safe.length),fingerprint:a.sourceEvidence?.scientificInputFingerprint||null,elevHash:a.sourceEvidence?.sourceHashes?.elevationGridHash||null,safe};
  });
  rows.push({name,prep,out,count:snap.count,corridors:snap.corridors,fingerprint:snap.fingerprint,elevHash:snap.elevHash,canon:canon(snap.safe)});
}
const pass=hash(rows[0].canon)===hash(rows[2].canon)&&rows[0].count===rows[2].count&&rows[0].fingerprint===rows[2].fingerprint&&rows[0].elevHash===rows[2].elevHash;
console.log('EARTHLINE_PROPERTY_PARENT_PROOF_17429 '+JSON.stringify({pass,rows:rows.map(({canon,...r})=>r),hashes:{a1:hash(rows[0].canon),a2:hash(rows[2].canon)}}));
await browser.close();
if(!pass)process.exitCode=1;
