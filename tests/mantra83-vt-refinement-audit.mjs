import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(1200);
await page.locator('#searchInput').fill('Vermont');
const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(prev=>{
 const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
 return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
},before,{timeout:120000});
await page.waitForTimeout(400);
const out=await page.evaluate(()=>({
 perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
 scale:window.EARTHLINE_SCALE_REFINED_INPUT_16702||null,
 terrainGap:window.EARTHLINE_TERRAIN_GAP_REFINEMENT_16730||null,
 fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16780||null,
 late:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null,
 coverage:window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null,
 generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null
}));
console.log('M83_VT_REFINEMENT '+JSON.stringify(out));
await browser.close();
