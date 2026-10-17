import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const index=readFileSync('index.html','utf8'),launch=readFileSync('earthline-launch-16872.js','utf8'),css=readFileSync('earthline-launch-16872.css','utf8');
const elder=readFileSync('earthline-elder-worker-17129.js','utf8'),detector=readFileSync('tools/elder_trees/chmv2_array_detector_17129.py','utf8');
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
await page.goto('https://earthlinedevelopment.org/?mexicoParentProof17431='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForFunction(()=>typeof window.earthlineDeclarePropertyAtCrosshair16173==='function'&&typeof window.earthlineSelectedSiteFromCenter==='function'&&typeof window.applyLocation==='function',null,{timeout:45000,polling:100});

const parent={q:'Mexico',name:'Mexico',fullName:'Mexico',label:'Mexico',country:'Mexico',countryCode:'mx',placeType:'country',lat:23.6345,lng:-102.5528,precipIn:30,runC:.35,elevM:0,trendDeg:180,trendSlope:6,relief:8,rough:1,planning:false,regionalMode:true,propertyMode:false};
const seq=[['A1',-95.74612,16.68512],['B',-95.75225,16.68527],['A2',-95.74612,16.68512]];
const hash=v=>createHash('sha256').update(String(v)).digest('hex');
const canon=fs=>JSON.stringify((fs||[]).map((f,i)=>({id:String(f?.id??f?.properties?.id??f?.properties?.rawIndex??i),g:f?.geometry||null})).sort((a,b)=>a.id.localeCompare(b.id)));
const rows=[];
for(const [name,lng,lat] of seq){
  const prep=await page.evaluate(async ({parent,lng,lat})=>{
    const m=(typeof M!=='undefined'&&M)||window.M;
    const site=window.earthlineSelectedSiteFromCenter(parent,lng,lat,20);
    const applied=await window.applyLocation(site,null,m.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false,reason:'apply'};
    await new Promise(r=>setTimeout(r,900));
    window.earthlineSetPropertyTarget16201({lng,lat,source:'parent-proof-17431'},{openPanel:false});
    return {ok:true,loc:m.loc,target:window.EARTHLINE_PROPERTY_TARGET_16201};
  },{parent,lng,lat});
  const out=await page.evaluate(async()=>{
    try{return {ok:(await window.earthlineDeclarePropertyAtCrosshair16173())!==false}}catch(e){return {ok:false,error:String(e)}}
  });
  const snap=await page.evaluate(()=>{
    const m=(typeof M!=='undefined'&&M)||window.M,a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{},safe=m?.authoritativeSafeSwales15815?.features||[];
    return {count:safe.length,corridors:Number(a.corridors??safe.length),settled:a.settled===true,result:a.result===true,error:a.error||null,fingerprint:a.sourceEvidence?.scientificInputFingerprint||null,elevHash:a.sourceEvidence?.sourceHashes?.elevationGridHash||null,flowHash:a.sourceEvidence?.sourceHashes?.flowAccumulationHash||null,safe};
  });
  rows.push({name,prep,out,count:snap.count,corridors:snap.corridors,settled:snap.settled,result:snap.result,error:snap.error,fingerprint:snap.fingerprint,elevHash:snap.elevHash,flowHash:snap.flowHash,canon:canon(snap.safe)});
}
const a1=rows[0],a2=rows[2];
const pass=a1.out.ok&&a2.out.ok&&a1.result&&a2.result&&hash(a1.canon)===hash(a2.canon)&&a1.count===a2.count&&a1.fingerprint===a2.fingerprint&&a1.elevHash===a2.elevHash&&a1.flowHash===a2.flowHash;
console.log('EARTHLINE_PROPERTY_PARENT_PROOF_17431 '+JSON.stringify({pass,rows:rows.map(({canon,...r})=>r),hashes:{a1:hash(a1.canon),a2:hash(a2.canon)}}));
await browser.close();
if(!pass)process.exitCode=1;
