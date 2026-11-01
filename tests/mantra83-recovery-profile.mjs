import {webkit} from 'playwright';
const browser=await webkit.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(700);
await page.locator('#searchInput').fill('Vermont');
const t0=Date.now();
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.tier||'').toLowerCase()==='regional',{timeout:120000});
const out=await page.evaluate(t0=>{
 const keys=Object.keys(window).filter(k=>/EARTHLINE_.+(REFIN|GAP|SUPERTILE|DISPERSION|COVERAGE|RECOVERY|SELECTION)/i.test(k)).sort();
 const audits={};for(const k of keys){try{const v=window[k];if(v&&typeof v==='object')audits[k]=v}catch(_){}}
 return {totalMs:Date.now()-t0,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,audits};
},t0);
console.log('M83_RECOVERY_PROFILE '+JSON.stringify(out));
await browser.close();
