import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const BASE='http://127.0.0.1:8790/';
const server=spawn('python3',['-m','http.server','8790','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await sleep(700);
const browser=await chromium.launch({headless:true});

async function newPage(w=1440,h=900,mobile=false){
  const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE+'?elder_launch_17097='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForFunction(()=>!!window.EARTHLINE_ELDER_TREES_V1_17097,{timeout:20000});
  return {ctx,page,errors};
}
async function runRegional(page,query){
  await page.evaluate(q=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    if(!i||!b)throw new Error('search controls missing');
    i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },query);
  await page.waitForFunction(()=>{
    const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;if(err)return true;
    return /screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||''))&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;
  },{timeout:35000,polling:120}).catch(()=>{});
  await page.waitForTimeout(500);
  return await page.evaluate(()=>({
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),
    elder:window.EARTHLINE_ELDER_TREES_V1_17097?.summary?.()||null,
    elderGauge:String(document.getElementById('earthlineElderTreesGauge17097')?.textContent||''),
    elderAudit:window.EARTHLINE_ELDER_TREE_LAST_17097||null
  }));
}

const desk=await newPage();
const rows={};
for(const q of ['Colorado','Arizona','Vermont']){
  rows[q]=await runRegional(desk.page,q);
  console.log('EARTHLINE_ELDER_REGIONAL_17097 '+JSON.stringify({q,row:rows[q]}));
}
const prep=await desk.page.evaluate(async()=>{
  const t={lng:-73.012909,lat:44.513845};
  const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,t.lng,t.lat,20);
  const ok=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
  if(!ok)return false;
  await new Promise(r=>setTimeout(r,700));
  return !!window.earthlineSetPropertyTarget16201({lng:t.lng,lat:t.lat,source:'elder-v1-regression'},{openPanel:false});
});
const p0=Date.now();let pErr=null;
if(prep){try{await desk.page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169())}catch(e){pErr=String(e)}}
const property=await desk.page.evaluate(()=>({
  audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  safety:M?.safetyAudit15806||null,
  lock:M?.propertyResultLock15815||null,
  safe:Number(M?.authoritativeSafeSwales15815?.length||0),
  elder:window.EARTHLINE_ELDER_TREES_V1_17097?.summary?.()||null,
  elderGauge:String(document.getElementById('earthlineElderTreesGauge17097')?.textContent||''),
  confidenceRule:String(window.EARTHLINE_ELDER_TREES_V1_17097?.confidenceRule||'')
}));
property.wallMs=Date.now()-p0;property.error=pErr;

const mobile=await newPage(390,844,true);
const mobileAudit=await mobile.page.evaluate(()=>({
  rail:!!document.getElementById('earthlineRail16188'),
  orb:!!document.querySelector('#runBtn svg use[href="#orb"]'),
  elderOwner:!!window.EARTHLINE_ELDER_TREES_V1_17097,
  overflow:document.documentElement.scrollWidth<=innerWidth+2
}));

const pass={
  colorado:!rows.Colorado.error&&Number(rows.Colorado.perf?.totalMs)>0&&Number(rows.Colorado.perf?.totalMs)<=15000&&Number(rows.Colorado.elder?.total)>0&&!/not yet generated/i.test(rows.Colorado.elderGauge),
  arizona:!rows.Arizona.error&&Number(rows.Arizona.perf?.totalMs)>0&&Number(rows.Arizona.perf?.totalMs)<=15000&&Number(rows.Arizona.elder?.total)>0&&!/not yet generated/i.test(rows.Arizona.elderGauge),
  vermont:!rows.Vermont.error&&Number(rows.Vermont.perf?.totalMs)>0&&Number(rows.Vermont.perf?.totalMs)<=15000&&Number(rows.Vermont.elder?.total)>0,
  property:prep&&!pErr&&property.audit?.settled===true&&property.audit?.result===true&&property.safe>0&&property.safety?.verified===true&&property.lock?.safetyVerified===true&&property.wallMs<=15000,
  confidenceName:/Elder Tree Confidence/i.test(String(property.confidenceRule||'')),
  desktopErrors:desk.errors.length===0,
  mobile:mobileAudit.rail&&mobileAudit.orb&&mobileAudit.elderOwner&&mobileAudit.overflow&&mobile.errors.length===0
};
console.log('EARTHLINE_ELDER_LAUNCH_17097 '+JSON.stringify({rows,property,mobileAudit,pass,desktopErrors:desk.errors,mobileErrors:mobile.errors}));
await desk.ctx.close();await mobile.ctx.close();await browser.close();server.kill('SIGTERM');
if(!Object.values(pass).every(Boolean))process.exitCode=1;
