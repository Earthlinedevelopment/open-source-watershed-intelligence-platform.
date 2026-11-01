import {webkit,devices} from 'playwright';

async function run(label,contextOpts){
  const browser=await webkit.launch({headless:true});
  const context=await browser.newContext(contextOpts);
  const page=await context.newPage();
  await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForTimeout(1000);
  await page.locator('#searchInput').fill('Vermont');
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  const t0=Date.now();
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
  },before,{timeout:180000});
  await page.waitForTimeout(300);
  const out=await page.evaluate(t0=>({
    totalMs:Date.now()-t0,
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    vtClip:window.EARTHLINE_VERMONT_CLIP_PERFORMANCE_16318||window.EARTHLINE_VERMONT_CLIP_PERFORMANCE_16317||null,
    generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
    scale:window.EARTHLINE_SCALE_REFINED_INPUT_16702||null,
    terrainGap:window.EARTHLINE_TERRAIN_GAP_REFINEMENT_16730||null,
    supertile:window.EARTHLINE_STATEWIDE_SUPERTILE_16839||null,
    fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16780||null,
    coverage:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,
    late:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null
  }),t0);
  console.log('M83_WEBKIT_PHASE '+JSON.stringify({label,...out}));
  await browser.close();
}
await run('desktop-webkit',{viewport:{width:1440,height:900}});
await run('iphone-webkit',{...devices['iPhone 13']});
