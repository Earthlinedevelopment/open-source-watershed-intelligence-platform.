import {chromium} from 'playwright';
import fs from 'node:fs';
const chrome=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome)throw new Error('system Chrome missing');
const OLD="async function earthlineCooperativeYield16661(){if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();return new Promise(r=>setTimeout(r,0));}";
const NEW="async function earthlineCooperativeYield16661(){return new Promise(resolve=>{const ch=new MessageChannel();ch.port1.onmessage=()=>{try{ch.port1.close();ch.port2.close()}catch(_){}resolve()};ch.port2.postMessage(0)});}";

function signature(fs){return (fs||[]).map(f=>JSON.stringify({g:f.geometry,p:{s:f.properties?.slope_pct,score:f.properties?.score,rank:f.properties?.rank,code:f.properties?.display_code}})).sort();}
async function run(modified){
  const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  if(modified)await page.route('https://earthlinedevelopment.org/',async route=>{
    const res=await route.fetch();let body=await res.text();
    if(!body.includes(OLD))throw new Error('live yield owner missing');
    body=body.replace(OLD,NEW);
    await route.fulfill({response:res,body});
  });
  await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForTimeout(700);
  const out={};
  for(const q of ['Vermont','Arizona']){
    const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
    await page.locator('#searchInput').fill(q);const t0=Date.now();
    await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
    await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:90000});
    const r=await page.evaluate(t0=>({ms:Date.now()-t0,fs:window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]}),t0);
    out[q]={ms:r.ms,sig:signature(r.fs),count:r.fs.length,maxSlope:Math.max(0,...r.fs.map(f=>Number(f?.properties?.slope_pct)||0))};
  }
  await browser.close();return out;
}
const base=await run(false),candidate=await run(true);
for(const q of ['Vermont','Arizona']){
  if(JSON.stringify(base[q].sig)!==JSON.stringify(candidate[q].sig))throw new Error(q+' science output changed');
  if(candidate[q].maxSlope>4)throw new Error(q+' slope violation');
}
console.log('M83_SHARED_YIELD_CHROME_PASS '+JSON.stringify({Vermont:{before:base.Vermont.ms,after:candidate.Vermont.ms,count:candidate.Vermont.count},Arizona:{before:base.Arizona.ms,after:candidate.Arizona.ms,count:candidate.Arizona.count}}));
