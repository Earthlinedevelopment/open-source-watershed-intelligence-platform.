import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

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
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?mexicoTimeline17428='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForFunction(()=>typeof window.earthlineDeclarePropertyAtCrosshair16173==='function'&&typeof window.earthlineSetPropertyTarget16201==='function'&&typeof window.earthlineSelectedSiteFromCenter==='function'&&typeof window.applyLocation==='function',null,{timeout:45000,polling:100});

const seq=[
  {name:'A1',lng:-95.74612,lat:16.68512},
  {name:'B',lng:-95.75225,lat:16.68527},
  {name:'A2',lng:-95.74612,lat:16.68512}
];

async function snapshot(label){
  return await page.evaluate(label=>{
    const m=(typeof M!=='undefined'&&M)||window.M||null;
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||a?.publicationAudit||null;
    const lock=m?.propertyResultLock15815||null;
    const safe=m?.authoritativeSafeSwales15815?.features||[];
    return {
      label,
      now:Date.now(),
      searchGen:Number(m?.searchGen??-1),
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      audit:{
        serial:Number(a?.serial||0),stage:a?.stage||null,settled:a?.settled===true,result:a?.result===true,
        scientificSettled:a?.scientificSettled===true,scientificResult:a?.scientificResult===true,
        searchGenAtLaunch:a?.searchGenAtLaunch??null,searchGenAtSettle:a?.searchGenAtSettle??null,
        corridors:a?.corridors??null,error:a?.error||null,center:a?.center||null,
        sourceEvidence:a?.sourceEvidence||null,stageTimings:a?.stageTimings||null
      },
      publication:{
        published:p?.published===true,publicationCount:Number(p?.publicationCount??p?.safeCount??-1),
        searchGen:p?.searchGen??null,runToken:p?.runToken??null,reason:p?.reason||null
      },
      lock:{
        safetyVerified:lock?.safetyVerified===true,searchGen:lock?.searchGen??null,
        sourceStateFingerprint:lock?.sourceStateFingerprint??null,
        scientificInputFingerprint:lock?.scientificInputFingerprint??null,
        noBuildMaskHash:lock?.noBuildMaskHash??null,
        vectorNoBuildMaskHash:lock?.vectorNoBuildMaskHash??null
      },
      safeCount:safe.length,
      swaleCount:Number(m?.swales?.length??m?.swales?.features?.length??0),
      rechCount:Number(m?.rechZones?.length??m?.rechZones?.features?.length??0),
      propertyPublication:m?.propertyPublication15816||null,
      tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
      propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
      runState:String(document.documentElement.dataset.earthlineRunState||'')
    };
  },label);
}

const rows=[];
for(const pt of seq){
  const prepared=await page.evaluate(async p=>{
    const m=(typeof M!=='undefined'&&M)||window.M||null;
    const parent=m?.loc||{q:'Mexico',name:'Mexico',fullName:'Mexico',label:'Mexico',lat:p.lat,lng:p.lng,placeType:'country'};
    const site=window.earthlineSelectedSiteFromCenter(parent,p.lng,p.lat,20);
    if(!site)return {ok:false,reason:'site'};
    const applied=await window.applyLocation(site,null,m.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false,reason:'apply'};
    await new Promise(r=>setTimeout(r,900));
    const set=window.earthlineSetPropertyTarget16201({lng:p.lng,lat:p.lat,source:'mexico-timeline-17428'},{openPanel:false});
    return {ok:!!set,target:window.EARTHLINE_PROPERTY_TARGET_16201||null,searchGen:Number(m.searchGen||0)};
  },pt);

  const before=await snapshot('before');
  const started=Date.now();
  const call=await page.evaluate(async()=>{
    try{
      const out=await Promise.race([
        Promise.resolve(window.earthlineDeclarePropertyAtCrosshair16173()),
        new Promise((_,rej)=>setTimeout(()=>rej(new Error('property promise timeout')),60000))
      ]);
      return {ok:out!==false,out};
    }catch(e){return {ok:false,error:String(e&&e.message||e)}}
  });
  const returnMs=Date.now()-started;

  const samples=[];
  samples.push(await snapshot('return'));
  for(const [label,delay] of [['+0.5s',500],['+1.5s',1000],['+3s',1500],['+6s',3000]]){
    await page.waitForTimeout(delay);
    samples.push(await snapshot(label));
  }

  const row={name:pt.name,pt,prepared,call,returnMs,before,samples};
  rows.push(row);
  console.log('EARTHLINE_MEXICO_TIMELINE_17428_ROW '+JSON.stringify(row));
}
console.log('EARTHLINE_MEXICO_TIMELINE_17428 '+JSON.stringify({rows,errors}));
await browser.close();
