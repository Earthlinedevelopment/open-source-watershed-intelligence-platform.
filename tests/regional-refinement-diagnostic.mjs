import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';
const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATE=process.env.STATE;
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1600,height:900}});
await installCandidateOrigin(context);
const page=await context.newPage();
await page.goto(URL+'?refine-diag='+encodeURIComponent(STATE)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.locator('#searchInput').fill(STATE);
await page.waitForTimeout(700);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:STATE}).first();
await opt.waitFor({state:'visible',timeout:8000}).catch(()=>{});
if(await opt.count())await opt.click().catch(()=>{});
await page.locator('#runBtn').click();
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:90000,polling:100});
await page.waitForTimeout(1500);
const out=await page.evaluate(state=>{
  const sw=(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).filter(f=>f?.geometry?.type==='LineString');
  return {
    state,
    error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    top:sw.slice().sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999)).slice(0,20).map(f=>({
      rank:f.properties?.rank,score:f.properties?.score,grade:f.properties?.grade,
      slope:f.properties?.slope_pct,confidence:f.properties?.confidence,
      label:f.properties?.label,
      mid:(()=>{const c=f.geometry.coordinates;return c[Math.floor((c.length-1)/2)]})()
    })),
    scoreOrder:window.EARTHLINE_REGIONAL_SCORE_ORDER_16717||null,
    refinedSelection:window.EARTHLINE_REFINED_SELECTION_16702||null,
    refinedInput:window.EARTHLINE_SCALE_REFINED_INPUT_16702||null,
    terrainGap:window.EARTHLINE_TERRAIN_GAP_REFINEMENT_16730||null,
    grouped:window.EARTHLINE_GROUPED_LOCAL_PHASE_16841||window.EARTHLINE_GROUPED_STATEWIDE_LOCAL_16841||null
  };
},STATE);
console.log('EARTHLINE_REFINEMENT_DIAG '+JSON.stringify(out));
await browser.close();
