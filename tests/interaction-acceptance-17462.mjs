import { chromium, firefox, webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
if(!launcher)throw new Error('unsupported '+BROWSER);
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE+'?interaction17462='+BROWSER+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});

// State identity gate.
await page.locator('#searchInput').fill('Vermont');await page.waitForTimeout(800);
const vtOptions=await page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').evaluateAll(els=>els.map(e=>({text:String(e.textContent||'').replace(/\s+/g,' ').trim(),q:e.dataset.query||''})));
const noFakeVermont=!vtOptions.some(o=>/vermont\s+country/i.test(o.q)||/vermont\s+city/i.test(o.q)||/vermont\s+—\s+country/i.test(o.text));
const hasVermontState=vtOptions.some(o=>o.q==='Vermont'||/Vermont\s+—\s+State \/ Region/i.test(o.text));
await page.locator('#searchInput').fill('Georgia');await page.waitForTimeout(700);
const gaOptions=await page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').evaluateAll(els=>els.map(e=>e.dataset.query||''));
const georgiaCountryPreserved=gaOptions.some(q=>/^Georgia country$/i.test(q));

// Load Vermont Regional and exercise repeat Property queue.
await page.locator('#searchInput').fill('Vermont');await page.waitForTimeout(500);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
const exact=opts.filter({has:page.locator('strong', {hasText:/^Vermont — State \/ Region$/})});
if(await exact.count())await exact.first().click();else{
  await page.locator('#searchInput').fill('Vermont');
  const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
}
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
const label=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();
await label.waitFor({state:'visible',timeout:30000});await label.click({force:true});
await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000,polling:100});
await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();
await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled},null,{timeout:30000,polling:100});
const a=await page.evaluate(()=>({target:{...(window.EARTHLINE_PROPERTY_TARGET_16201||{})},serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)}));
await page.locator('#earthlineDeclareProperty16169').click();
await page.waitForFunction(pre=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>pre,a.serial,{timeout:5000,polling:50});
const firstSerial=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));

// Move target materially while first run is still active.
await page.evaluate(t=>{
  const lng=Number(t.lng)+0.004,lat=Number(t.lat)+0.002;
  if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201({lng,lat,source:'repeat-queue-test-17462',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
  else window.EARTHLINE_PROPERTY_TARGET_16201={lng,lat,source:'repeat-queue-test-17462',code:'',score:0,at:new Date().toISOString()};
},a.target);
// Reconcile can re-enable the control while the governed run is terminalizing.
await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running'&&!!b&&!b.disabled},null,{timeout:8000,polling:50}).catch(()=>{});
const button=page.locator('#earthlineDeclareProperty16169');
let onePressSent=false;
try{await button.click({timeout:2000});onePressSent=true}catch(_){
  onePressSent=await page.evaluate(()=>{
    const b=document.getElementById('earthlineDeclareProperty16169');
    if(typeof b?.onpointerup!=='function')return false;
    b.onpointerup(new PointerEvent('pointerup',{button:0,bubbles:true}));
    return true;
  });
}
let queued=false;
try{await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_REPEAT_QUEUE_17457?.state==='queued'||window.EARTHLINE_PROPERTY_REPEAT_QUEUE_17457?.state==='launching'||window.EARTHLINE_PROPERTY_REPEAT_QUEUE_17457?.state==='started',null,{timeout:3000,polling:50});queued=true}catch(_){}
let secondStarted=false;
try{await page.waitForFunction(s=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>s,firstSerial,{timeout:30000,polling:100});secondStarted=true}catch(_){}

const storageBad=await page.evaluate(()=>{
  for(let i=0;i<localStorage.length;i++){const v=String(localStorage.getItem(localStorage.key(i))||'');if(/Vermont\s+country/i.test(v))return true}
  return false;
});
const state={queue:await page.evaluate(()=>window.EARTHLINE_PROPERTY_REPEAT_QUEUE_17457||null),run:await page.evaluate(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null)};
const pass=noFakeVermont&&hasVermontState&&georgiaCountryPreserved&&!storageBad&&onePressSent&&queued&&secondStarted&&!errors.length;
const result={browser:BROWSER,pass,noFakeVermont,hasVermontState,georgiaCountryPreserved,storageBad,vtOptions,gaOptions,onePressSent,queued,secondStarted,firstSerial,state,errors};
mkdirSync('artifacts/interaction-17462',{recursive:true});
writeFileSync('artifacts/interaction-17462/'+BROWSER+'.json',JSON.stringify(result,null,2));
console.log('EARTHLINE_INTERACTION_17462 '+JSON.stringify(result));
await browser.close();
if(!pass)process.exitCode=1;
