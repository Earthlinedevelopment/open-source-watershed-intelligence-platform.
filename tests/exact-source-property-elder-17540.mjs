import { chromium, firefox, webkit } from 'playwright';

const browserName=process.env.BROWSER||'chromium';
const headless=process.env.HEADLESS!=='false';
const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const TARGET={lng:-72.691631,lat:42.931759};
const browserType={chromium,firefox,webkit}[browserName];
if(!browserType) throw new Error('unknown browser '+browserName);

const browser=await browserType.launch({headless});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{ if(m.type()==='error') console.log('CONSOLE_ERROR',m.text()); });

async function waitApp(){
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>typeof window.earthlineDeclarePropertyAtCrosshair16173==='function',{timeout:120000});
  await page.waitForFunction(()=>!!document.getElementById('earthlineDeclareProperty16169'),{timeout:120000});
}
async function prepTarget(){
  await page.evaluate(({lng,lat})=>{
    const t={lng,lat,source:'exact-source-gate-17540',code:'',score:0,query:'Exact source Vermont gate',at:new Date().toISOString()};
    if(typeof window.earthlineSetPropertyTarget16201==='function') window.earthlineSetPropertyTarget16201(t,{openPanel:false});
    else window.EARTHLINE_PROPERTY_TARGET_16201=t;
    try{ window.earthlineMap?.jumpTo?.({center:[lng,lat],zoom:17.5}); }catch(_){}
  },TARGET);
  await page.waitForTimeout(800);
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
  await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.scientificResult===true || window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.result===true,null,{timeout:15000});
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
  console.log('EARTHLINE_PASS',JSON.stringify({browser:browserName,first,second,pageErrors}));
}finally{
  await browser.close();
}
