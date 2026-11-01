import {chromium,webkit} from 'playwright';
import fs from 'node:fs';
const chrome=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
const old="async function earthlineCooperativeYield16661(){if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();return new Promise(r=>setTimeout(r,0));}";
const neu="async function earthlineCooperativeYield16661(){return new Promise(resolve=>{const ch=new MessageChannel();ch.port1.onmessage=()=>{try{ch.port1.close();ch.port2.close()}catch(_){}resolve()};ch.port2.postMessage(0)});}";
async function run(type,opts={}){
 const browser=await type.launch(opts),page=await browser.newPage({viewport:{width:1440,height:900}});
 await page.route('https://earthlinedevelopment.org/',async route=>{const res=await route.fetch();let body=await res.text();if(!body.includes(old))throw new Error('yield owner missing');body=body.replace(old,neu);await route.fulfill({response:res,body});});
 await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
 await page.waitForTimeout(800);await page.locator('#searchInput').fill('Vermont');const t0=Date.now();
 await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
 await page.waitForFunction(()=>String(document.documentElement.dataset.earthlineRunState||'')==='published',{timeout:90000});
 const out=await page.evaluate(t0=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147,fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return{ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,maxSlope:Math.max(0,...fs.map(f=>Number(f?.properties?.slope_pct)||0))};},t0);
 await browser.close();return out;
}
if(!chrome)throw new Error('system Chrome missing');
const cr=await run(chromium,{headless:true,executablePath:chrome,args:['--no-sandbox']});
const wk=await run(webkit,{headless:true});
for(const r of [cr,wk]){if(r.swales!==81||r.rendered<81||r.maxSlope>4)throw new Error('science output mismatch '+JSON.stringify(r));}
if(wk.ms>45000)throw new Error('WebKit still too slow '+wk.ms);
console.log('M83_SHARED_YIELD_PASS '+JSON.stringify({chromium:cr,webkit:wk}));
