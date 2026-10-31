import {chromium,devices} from 'playwright';
const browser=await chromium.launch({headless:true});
const cases=[
  {name:'desktop',context:{viewport:{width:1440,height:900}}},
  {name:'phone',context:{...devices['iPhone 13']}}
];
const out=[];
for(const c of cases){
  const ctx=await browser.newContext(c.context);
  const p=await ctx.newPage();
  await p.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
  await p.waitForTimeout(1800);
  for(const q of ['Vermont','Arizona']){
    const before=await p.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
    await p.locator('#searchInput').fill(q);
    const t=Date.now();
    await p.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
    await p.waitForFunction(prev=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
      return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
    },before,{timeout:120000});
    await p.waitForTimeout(500);
    out.push(await p.evaluate(({name,q,t})=>({
      name,q,wallMs:Date.now()-t,
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
      scale:window.EARTHLINE_SCALE_REFINED_INPUT_16702||null,
      terrainGap:window.EARTHLINE_TERRAIN_GAP_REFINEMENT_16730||null,
      statewide:window.EARTHLINE_STATEWIDE_SUPERTILE_16839||null,
      fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,
      coverage:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,
      late:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null,
      spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null
    }),{name:c.name,q,t}));
  }
  await ctx.close();
}
await browser.close();
function slim(x){
  const pick=o=>o?Object.fromEntries(Object.entries(o).filter(([k])=>['added','elapsedMs','tiles','selectedTiles','selected','unresolvedAfter','gaps','groups','failed','failedTiles','opportunityCells','publishedCells','candidateCells','selectedCells','targetCells'].includes(k))):null;
  return {...x,scale:pick(x.scale),terrainGap:pick(x.terrainGap),statewide:pick(x.statewide),fine:pick(x.fine),coverage:pick(x.coverage),late:pick(x.late),spread:pick(x.spread)};
}
console.log('M83_SHARED_REFINEMENT_PROFILE '+JSON.stringify(out.map(slim)));
