import {chromium} from 'playwright';
import fs from 'node:fs';
const chrome=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome)throw new Error('chrome missing');
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?elder-verify=1',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(1800);
const installed=await page.evaluate(()=>({
  elder:typeof window.EARTHLINE_ELDER_TREES_V1_17097,
  workerScript:[...document.scripts].some(s=>String(s.src||'').includes('earthline-elder-restored-17097.js'))
}));
if(installed.elder!=='object')throw new Error('Elder engine not installed');
await page.locator('#searchInput').fill('61 Sleepy Hollow Rd Essex Vermont');
const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(prev=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
  return !!d&&String(d.runToken||'')!==String(prev||'')&&String(d.tier||d.mode||'').toLowerCase()==='property';
},before,{timeout:120000});
await page.waitForTimeout(1200);
await page.waitForFunction(()=>{
  const e=window.EARTHLINE_ELDER_TREE_LAST_17097;
  return !!e && ['property-committed','property-pending','ready'].includes(String(e.state||''));
},{timeout:120000});
const result=await page.evaluate(()=>({
  displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
  elderLast:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
  elderSummary:window.EARTHLINE_ELDER_TREES_V1_17097?.summary?.()||null,
  elderFeatures:window.EARTHLINE_ELDER_TREES_V1_17097?.features?.()?.length||0,
  elderLayer:!!window.earthlineMap?.getLayer?.('earthline-elder-tree-points-17097'),
  elderSource:!!window.earthlineMap?.getSource?.('earthline-elder-trees-17097'),
  propertyReady:!!((typeof M!=='undefined'&&M)||window.M)?.analysisReady
}));
console.log('M83_PRODUCTION_ELDER_VERIFY '+JSON.stringify({installed,result,errors}));
if(!result.propertyReady)throw new Error('Property not ready');
if(!result.elderLayer||!result.elderSource)throw new Error('Elder map owner absent');
if(!result.elderLast)throw new Error('Elder result absent');
await browser.close();
