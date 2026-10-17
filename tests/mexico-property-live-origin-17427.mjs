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
  if(req.resourceType()==='document'&&u.pathname==='/'){
    return route.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  }
  if(u.pathname==='/earthline-launch-16872.js'){
    return route.fulfill({status:200,body:launch,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  }
  if(u.pathname==='/earthline-launch-16872.css'){
    return route.fulfill({status:200,body:css,headers:{'content-type':'text/css; charset=utf-8','cache-control':'no-store'}});
  }
  if(u.pathname==='/earthline-elder-worker-17129.js'){
    return route.fulfill({status:200,body:elder,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  }
  if(u.pathname==='/tools/elder_trees/chmv2_array_detector_17129.py'){
    return route.fulfill({status:200,body:detector,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
  }
  return route.continue();
});

const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?mexicoCandidate17427='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForFunction(()=>typeof window.earthlineDeclarePropertyAtCrosshair16173==='function'&&typeof window.earthlineSetPropertyTarget16201==='function'&&typeof window.earthlineSelectedSiteFromCenter==='function'&&typeof window.applyLocation==='function',null,{timeout:45000,polling:100});

const seq=[
  {name:'A1',lng:-95.74612,lat:16.68512},
  {name:'B',lng:-95.75225,lat:16.68527},
  {name:'A2',lng:-95.74612,lat:16.68512}
];

const hash=v=>createHash('sha256').update(String(v)).digest('hex');
const canonical=fs=>(fs||[]).map((f,i)=>({
  id:String(f?.id??f?.properties?.id??f?.properties?.rawIndex??i),
  geom:f?.geometry||null
})).sort((a,b)=>(a.id).localeCompare(b.id));

const rows=[];
for(const pt of seq){
  const prepared=await page.evaluate(async p=>{
    const parent=(typeof M!=='undefined'&&M?.loc)||{
      q:'Mexico',name:'Mexico',fullName:'Mexico',label:'Mexico',
      lat:p.lat,lng:p.lng,placeType:'country'
    };
    const site=window.earthlineSelectedSiteFromCenter(parent,p.lng,p.lat,20);
    if(!site)return {ok:false,reason:'site'};
    const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false,reason:'apply'};
    await new Promise(r=>setTimeout(r,900));
    const set=window.earthlineSetPropertyTarget16201({lng:p.lng,lat:p.lat,source:'mexico-aba-17427'},{openPanel:false});
    return {ok:!!set,target:window.EARTHLINE_PROPERTY_TARGET_16201||null};
  },pt);

  const started=Date.now();
  const run=await page.evaluate(async()=>{
    try{
      const fn=window.earthlineDeclarePropertyAtCrosshair16173;
      const result=await Promise.race([
        Promise.resolve(fn()),
        new Promise((_,rej)=>setTimeout(()=>rej(new Error('property promise timeout')),60000))
      ]);
      return {ok:result!==false,result};
    }catch(e){return {ok:false,error:String(e&&e.message||e)}}
  });
  const elapsedMs=Date.now()-started;
  await page.waitForTimeout(700);

  const snap=await page.evaluate(()=>({
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
    safe:(typeof M!=='undefined'&&M?.authoritativeSafeSwales15815?.features)||[],
    safety:(typeof M!=='undefined'&&M?.safetyAudit15806)||null,
    lock:(typeof M!=='undefined'&&M?.propertyResultLock15815)||null,
    tier:String(document.documentElement.dataset.earthlineAnalysisTier||'')
  }));
  rows.push({
    name:pt.name,prepared,run,elapsedMs,target:snap.target,
    auditResult:snap.audit?.result===true,settled:snap.audit?.settled===true,
    corridors:Number(snap.audit?.corridors??snap.publication?.publicationCount??snap.safe.length),
    safeCount:snap.safe.length,safetyVerified:snap.safety?.verified===true,
    lockVerified:snap.lock?.safetyVerified===true,tier:snap.tier,
    canon:JSON.stringify(canonical(snap.safe))
  });
  console.log('EARTHLINE_MEXICO_LIVE_17427_ROW '+JSON.stringify(rows.at(-1)));
}

const a1=rows[0],b=rows[1],a2=rows[2];
const aRepeat=hash(a1.canon)===hash(a2.canon);
const countsMatch=a1.safeCount===a2.safeCount&&a1.corridors===a2.corridors;
const centersOk=rows.every((r,i)=>Math.abs(Number(r.target?.lng)-seq[i].lng)<0.0005&&Math.abs(Number(r.target?.lat)-seq[i].lat)<0.0005);
const scientific=rows.every(r=>r.prepared?.ok===true&&r.run?.ok===true&&r.auditResult&&r.settled&&r.safetyVerified&&r.lockVerified&&r.tier==='property');
const pass=scientific&&centersOk&&aRepeat&&countsMatch;
console.log('EARTHLINE_MEXICO_LIVE_17427 '+JSON.stringify({
  pass,scientific,centersOk,aRepeat,countsMatch,
  hashes:{a1:hash(a1.canon),a2:hash(a2.canon)},
  rows:rows.map(({canon,...r})=>r),errors
}));
await browser.close();
if(!pass)process.exitCode=1;
