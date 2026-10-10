import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/?elder_property_control_17097='+Date.now();
const TARGET={lng:-73.012909,lat:44.513845};
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:25000});

const prepared=await page.evaluate(async t=>{
  const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,t.lng,t.lat,20);
  const ok=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
  if(!ok)return false;
  await new Promise(r=>setTimeout(r,900));
  return !!window.earthlineSetPropertyTarget16201({lng:t.lng,lat:t.lat,source:'elder-prod-origin-control'},{openPanel:false});
},TARGET);

const started=Date.now();let callError=null;
if(prepared){try{await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169())}catch(e){callError=String(e)}}
const wallMs=Date.now()-started;
const result=await page.evaluate(()=>({
  audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  safety:M?.safetyAudit15806||null,
  lock:M?.propertyResultLock15815||null,
  safe:Number(M?.authoritativeSafeSwales15815?.length||0),
  liveCommitOwner:window.EARTHLINE_ELDER_TREES_V1_17097?.state||null
}));
const safeCount=Number(result.audit?.publicationAudit?.safeCount??result.audit?.corridors??result.safe??0);
const pass=prepared&&!callError&&result.audit?.settled===true&&result.audit?.result===true&&safeCount>0&&result.safety?.verified===true&&result.lock?.safetyVerified===true&&wallMs<=15000&&errors.length===0;
console.log('EARTHLINE_ELDER_PRODUCTION_PROPERTY_CONTROL_17097 '+JSON.stringify({prepared,wallMs,callError,safeCount,result,errors,pass}));
await browser.close();
if(!pass)process.exitCode=1;
