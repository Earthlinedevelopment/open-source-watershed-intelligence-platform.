import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const states=(process.env.STATES||'Arkansas|New York').split('|');
const browser=await chromium.launch({headless:true});
for(const stateName of states){
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  await page.goto(URL+'?diag17569='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},stateName);
  await page.waitForTimeout(30000);
  const snap=await page.evaluate(()=>({
    runState:document.documentElement.dataset.earthlineRunState||null,
    tier:document.documentElement.dataset.earthlineAnalysisTier||null,
    busy:document.getElementById('runBtn')?.getAttribute('aria-busy')||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    terminal:window.EARTHLINE_REGIONAL_TERMINAL_16539||null,
    publication:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    coverage:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    context:window.EARTHLINE_REGIONAL_CONTEXT_16198||null,
    package:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||null,
    land:window.EARTHLINE_LAND_VALIDITY_16584||null,
    landGrid:window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null,
    flowAudit:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    camera:window.EARTHLINE_REGIONAL_CAMERA_SETTLE_AUDIT_16334||null,
    progress:window.EARTHLINE_REGIONAL_PROGRESS_16347||null,
    generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
    spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,
    fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,
    gap:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,
    late:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null,
    displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null
  }));
  console.log('EARTHLINE_REGIONAL_STALL_DIAG_17569 '+JSON.stringify({state:stateName,snap}));
  await page.close();
}
await browser.close();