import { chromium, firefox, webkit } from 'playwright';
import fs from 'node:fs';
import crypto from 'node:crypto';

const browserName=process.env.BROWSER||'chromium';
const headless=process.env.HEADLESS!=='false';
const SITE_URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const TARGET={lng:-72.691631,lat:42.931759};
const browserType={chromium,firefox,webkit}[browserName];
if(!browserType) throw new Error('unknown browser '+browserName);

const files={
  index:'index.html',
  launch:'earthline-launch-16872.js',
  worker:'earthline-elder-worker-17129.js',
  detector:'tools/elder_trees/chmv2_array_detector_17129.py'
};
const bytes=Object.fromEntries(Object.entries(files).map(([k,p])=>[k,fs.readFileSync(p)]));
const provenance=Object.fromEntries(Object.entries(bytes).map(([k,b])=>[k,crypto.createHash('sha256').update(b).digest('hex')]));
console.log('EARTHLINE_PROVENANCE',JSON.stringify(provenance));

const browser=await browserType.launch({headless});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

await page.route('**/*',async route=>{
  const req=route.request();
  const u=new URL(req.url());
  if(req.isNavigationRequest() && u.hostname==='earthlinedevelopment.org' && (u.pathname==='/'||u.pathname==='/index.html')){
    return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:bytes.index});
  }
  if(u.hostname==='earthlinedevelopment.org' && u.pathname.endsWith('/earthline-launch-16872.js')){
    return route.fulfill({status:200,contentType:'application/javascript; charset=utf-8',body:bytes.launch});
  }
  if(u.hostname==='earthlinedevelopment.org' && u.pathname.endsWith('/earthline-elder-worker-17129.js')){
    return route.fulfill({status:200,contentType:'application/javascript; charset=utf-8',body:bytes.worker});
  }
  if(u.hostname==='earthlinedevelopment.org' && u.pathname.endsWith('/tools/elder_trees/chmv2_array_detector_17129.py')){
    return route.fulfill({status:200,contentType:'text/plain; charset=utf-8',body:bytes.detector});
  }
  return route.continue();
});

async function waitApp(){
  await page.goto(SITE_URL,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>typeof window.earthlineDeclarePropertyAtCrosshair16173==='function',{timeout:120000});
  await page.waitForFunction(()=>!!document.getElementById('earthlineDeclareProperty16169'),{timeout:120000});
  /* The existing panel owner schedules idle-globe normalization at 100/500/1400 ms.
     Property testing begins only after that startup-only sequence has expired. */
  await page.waitForTimeout(1800);
}
async function prepTarget(){
  /* Test-only target setup: settle the real map camera before setting Property.
     Slow Firefox/WebKit can emit a late moveend after jumpTo; that event is an
     existing app owner and legitimately rewrites the crosshair target. */
  await page.evaluate(({lng,lat})=>{
    try{
      const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null;
      m?.stop?.();
      m?.jumpTo?.({center:[lng,lat],zoom:17.5});
    }catch(_){}
  },TARGET);
  await page.waitForFunction(({lng,lat})=>{
    const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null;
    const c=m?.getCenter?.();
    return !!c && Math.abs(Number(c.lng)-lng)<1e-6 && Math.abs(Number(c.lat)-lat)<1e-6;
  },TARGET,{timeout:10000});
  await page.waitForTimeout(500);
  await page.waitForFunction(({lng,lat})=>{
    const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null;
    const c=m?.getCenter?.();
    return !!c && Math.abs(Number(c.lng)-lng)<1e-6 && Math.abs(Number(c.lat)-lat)<1e-6;
  },TARGET,{timeout:3000});
  await page.evaluate(({lng,lat})=>{
    const t={lng,lat,source:'exact-source-gate-17540',code:'',score:0,query:'Exact source Vermont gate',at:new Date().toISOString()};
    if(typeof window.earthlineSetPropertyTarget16201==='function') window.earthlineSetPropertyTarget16201(t,{openPanel:false});
    else window.EARTHLINE_PROPERTY_TARGET_16201=t;
  },TARGET);
  const actual=await page.evaluate(()=>window.EARTHLINE_PROPERTY_TARGET_16201||null);
  if(!actual || Math.abs(Number(actual.lng)-TARGET.lng)>1e-7 || Math.abs(Number(actual.lat)-TARGET.lat)>1e-7){
    throw new Error('exact Vermont Property target did not lock: '+JSON.stringify(actual));
  }
}
async function snapshot(){
  return await page.evaluate(()=>({
    audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    tier:document.documentElement.dataset.earthlineAnalysisTier||'',
    runState:document.documentElement.dataset.earthlinePropertyRunState||'',
    stage:window.EARTHLINE_PROPERTY_ACTIVE_STAGE_16178||null
  }));
}
async function runOnce(label){
  await prepTarget();
  const before=await snapshot();
  const beforeSerial=Number(before.audit?.serial||0);
  const button=page.locator('#earthlineDeclareProperty16169');
  const clickAt=Date.now();
  await button.click({force:true,timeout:15000});
  await page.waitForFunction(({beforeSerial})=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)===beforeSerial+1,{beforeSerial},{timeout:5000});
  const serialAt=Date.now();
  try{
    await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.scientificResult===true || window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.result===true,null,{timeout:15000});
  }catch(error){
    console.log('EARTHLINE_PROPERTY_TIMEOUT_SNAPSHOT',JSON.stringify({label,browser:browserName,elapsedMs:Date.now()-clickAt,snapshot:await snapshot()}));
    throw error;
  }
  const propertyAt=Date.now();
  await page.waitForFunction(()=>window.EARTHLINE_ELDER_TREE_LAST_17097?.state==='committed',null,{timeout:12000});
  const elderAt=Date.now();
  const after=await snapshot();
  const result={
    label,browser:browserName,beforeSerial,
    afterSerial:Number(after.audit?.serial||0),
    serialMs:serialAt-clickAt,propertyMs:propertyAt-clickAt,elderMs:elderAt-clickAt,
    propertyResult:after.audit?.scientificResult===true || after.audit?.result===true,
    elderState:after.elder?.state||null,
    elderIdentity:after.elder?.propertyRunIdentity||null,
    elderFeatureCount:Number(after.elder?.featureCount||0),
    elderWorkerTimings:after.elder?.workerTimings||null,
    target:after.target,tier:after.tier,runState:after.runState
  };
  console.log('EARTHLINE_RUN',JSON.stringify(result));
  if(result.afterSerial!==beforeSerial+1) throw new Error(label+': serial did not increment exactly once');
  if(result.serialMs>5000) throw new Error(label+': serial advancement exceeded 5s: '+result.serialMs);
  if(!result.propertyResult) throw new Error(label+': Property result not true');
  if(result.propertyMs>15000) throw new Error(label+': Property exceeded 15s: '+result.propertyMs);
  if(result.elderState!=='committed') throw new Error(label+': Elder did not commit');
  if(result.elderMs>12000) throw new Error(label+': Elder exceeded 12s: '+result.elderMs);
  return result;
}

try{
  await waitApp();
  const first=await runOnce('first');
  await page.waitForTimeout(500);
  const second=await runOnce('second');
  if(pageErrors.length) throw new Error('page errors: '+JSON.stringify(pageErrors));
  console.log('EARTHLINE_PASS',JSON.stringify({browser:browserName,provenance,first,second,pageErrors}));
}finally{
  await browser.close();
}
