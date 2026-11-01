import {chromium} from 'playwright'; import fs from 'node:fs';
const chrome=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome)throw new Error('chrome missing');
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(800);
await page.locator('#searchInput').fill('Vermont');
const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
const t0=Date.now();
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:90000});
await page.waitForTimeout(300);
const out=await page.evaluate(t0=>({
 totalMs:Date.now()-t0,
 generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
 perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
 coverage:window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null,
 terminal:window.EARTHLINE_REGIONAL_TERMINAL_16539||null
}),t0);
console.log('M83_CURRENT_SWALGEN '+JSON.stringify(out));
await browser.close();