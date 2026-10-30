import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(2200);
async function run(q){
 const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
 await page.locator('#searchInput').fill(q);
 const t=Date.now();
 await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
 await page.waitForFunction(prev=>{
   const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
   return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
 },before,{timeout:120000});
 const wall=Date.now()-t;
 await page.waitForTimeout(300);
 return await page.evaluate(wall=>{
   const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
   return {wallMs:wall,perf:p};
 },wall);
}
const out={};
for(const q of ['Vermont','Arkansas','Iowa','California'])out[q]=await run(q);
console.log('M83_REGIONAL_LATENCY '+JSON.stringify(out));
await browser.close();
