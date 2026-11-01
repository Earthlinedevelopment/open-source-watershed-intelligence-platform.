import {chromium} from 'playwright';
import fs from 'node:fs';
const chrome=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome)throw new Error('chrome missing');
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?elder-timing=1',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(1200);
await page.locator('#searchInput').fill('61 Sleepy Hollow Rd Essex Vermont');
const t0=Date.now();
const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(d.tier||d.mode||'').toLowerCase()==='property';},before,{timeout:120000});
const propertyMs=Date.now()-t0;
const elderStart=Date.now();
await page.waitForFunction(()=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097;return !!e&&['committed','failed'].includes(String(e.state||''));},{timeout:120000});
const elderAfterPropertyMs=Date.now()-elderStart;
const result=await page.evaluate(()=>({
  elderLast:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
  elderSummary:window.EARTHLINE_ELDER_TREES_V1_17097?.summary?.()||null,
  elderFeatures:window.EARTHLINE_ELDER_TREES_V1_17097?.features?.()?.length||0,
  layer:(()=>{try{return !!(earthlineMap&&earthlineMap.getLayer&&earthlineMap.getLayer('earthline-elder-tree-points-17097'))}catch(_){return false}})()
}));
console.log('M83_ELDER_TIMING '+JSON.stringify({propertyMs,elderAfterPropertyMs,totalMs:Date.now()-t0,result,errors}));
if(result.elderLast?.state!=='committed'||result.elderFeatures<=0||!result.layer)process.exitCode=2;
await browser.close();
