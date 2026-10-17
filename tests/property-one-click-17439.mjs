import { chromium, firefox, webkit } from 'playwright';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[];page.on('pageerror',e=>errors.push(String(e)));

await page.goto(BASE+'?propertyOneClick17439='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Vermont');
await page.waitForTimeout(700);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count())await opts.first().click();
const rb=page.locator('#runBtn');
if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});

const committed={lng:-72.5778,lat:44.2601};
await page.evaluate(p=>{
  const t={lng:p.lng,lat:p.lat,source:'one-click-gate-17439',code:'',score:0,parentRunToken:'',at:new Date().toISOString()};
  if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(t,{openPanel:false});
  else window.EARTHLINE_PROPERTY_TARGET_16201=t;
},committed);

// Reproduce the old failure: a programmatic camera move fires moveend before the user clicks.
await page.evaluate(()=>new Promise(resolve=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(!m?.jumpTo)return resolve();
  const c=m.getCenter();
  let done=false;const finish=()=>{if(done)return;done=true;setTimeout(resolve,150)};
  m.once?.('moveend',finish);
  m.jumpTo({center:[Number(c.lng)+0.18,Number(c.lat)-0.16],zoom:Number(m.getZoom?.()||8)+0.4,bearing:0,pitch:0});
  setTimeout(finish,1200);
}));
await page.waitForTimeout(250);

const before=await page.evaluate(()=>({
  serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  camera:(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.();return c?{lng:Number(c.lng),lat:Number(c.lat)}:null}catch(_){return null}})()
}));
const targetPreserved=Math.abs(Number(before.target?.lng)-committed.lng)<0.0005&&Math.abs(Number(before.target?.lat)-committed.lat)<0.0005;

await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return b&&getComputedStyle(b).display!=='none'&&!b.disabled},null,{timeout:20000,polling:100});
const t0=Date.now();
await page.locator('#earthlineDeclareProperty16169').click();

let started=false;
try{
  await page.waitForFunction(pre=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return Number(a?.serial||0)>pre || String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running';
  },before.serial,{timeout:3000,polling:50});
  started=true;
}catch(_){}

const launch=await page.evaluate(()=>({
  audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
  busy:document.getElementById('earthlineDeclareProperty16169')?.getAttribute('aria-busy')||null
}));
const exactCenter=!!launch.audit?.center&&Math.abs(Number(launch.audit.center.lng)-committed.lng)<0.0005&&Math.abs(Number(launch.audit.center.lat)-committed.lat)<0.0005;
const exactTarget=Math.abs(Number(launch.target?.lng)-committed.lng)<0.0005&&Math.abs(Number(launch.target?.lat)-committed.lat)<0.0005;
const pass=targetPreserved&&started&&exactCenter&&exactTarget;

console.log('EARTHLINE_PROPERTY_ONE_CLICK_17439 '+JSON.stringify({
  browser:BROWSER,pass,targetPreserved,started,startedWithinMs:Date.now()-t0,exactCenter,exactTarget,before,launch,errors
}));
await browser.close();
if(!pass)process.exitCode=1;
