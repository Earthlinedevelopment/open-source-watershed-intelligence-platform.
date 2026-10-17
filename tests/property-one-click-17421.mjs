import { chromium, firefox, webkit } from 'playwright';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));

await page.goto(BASE+'?propertyOneClick17421='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Vermont');
await page.waitForTimeout(700);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click();
const rb=page.locator('#runBtn');
if(await rb.isVisible() && !await rb.isDisabled()) await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});

const pt={lng:-72.5778,lat:44.2601};
await page.evaluate(p=>new Promise(resolve=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(!m?.jumpTo)return resolve();
  let done=false; const finish=()=>{if(done)return;done=true;resolve()};
  m.once?.('moveend',finish); m.jumpTo({center:[p.lng,p.lat],zoom:16.8,bearing:0,pitch:0}); setTimeout(finish,1500);
}),pt);
await page.evaluate(()=>{try{window.earthlineSyncPropertyTargetFromMap16201?.()}catch(_){}});

await page.waitForFunction(p=>{
  const b=document.getElementById('earthlineDeclareProperty16169');
  const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
  return b&&getComputedStyle(b).display!=='none'&&!b.disabled &&
    Math.abs(Number(t?.lng)-p.lng)<0.003&&Math.abs(Number(t?.lat)-p.lat)<0.003;
},pt,{timeout:20000,polling:100});

const before=await page.evaluate(()=>({
  serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  state:String(document.documentElement.dataset.earthlinePropertyRunState||'')
}));
const t0=Date.now();
await page.locator('#earthlineDeclareProperty16169').click();
let started=false;
try{
  await page.waitForFunction(pre=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return Number(a?.serial||0)>pre.serial ||
      String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running';
  },before,{timeout:3000,polling:50});
  started=true;
}catch(_){}

let settled=false;
try{
  await page.waitForFunction(pre=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return Number(a?.serial||0)>pre.serial && a?.settled===true;
  },before,{timeout:90000,polling:100});
  settled=true;
}catch(_){}

const after=await page.evaluate(()=>({
  audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
  tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
  publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null
}));
const clickSnap=await page.evaluate(()=>window.EARTHLINE_PROPERTY_CLICK_SNAPSHOT_17423||null);
const launchCenter=after.audit?.center||null;
const exactCenter=!!clickSnap&&Math.abs(Number(clickSnap.lng)-pt.lng)<0.0005&&Math.abs(Number(clickSnap.lat)-pt.lat)<0.0005&&
  !!launchCenter&&Math.abs(Number(launchCenter.lng)-pt.lng)<0.0005&&Math.abs(Number(launchCenter.lat)-pt.lat)<0.0005;
const pass=started&&exactCenter;
console.log('EARTHLINE_PROPERTY_ONE_CLICK_17421 '+JSON.stringify({
  browser:BROWSER,pass,started,settled,exactCenter,clickSnap,elapsedMs:Date.now()-t0,before,after,errors
}));
await browser.close();
if(!pass)process.exitCode=1;
