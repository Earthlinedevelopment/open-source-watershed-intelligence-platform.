import { chromium } from 'playwright';
import fs from 'node:fs';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?iowa-regional-audit='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});
const input=page.locator('#searchInput');
await input.fill('Iowa');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(200);
const started=Date.now();
await page.locator('#runBtn').click({force:true});
let settled=false,timeout=null;
try{
  await page.waitForFunction(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const tier=String(d&&(d.tier||d.mode)||'').toLowerCase();
    return tier==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
  },null,{timeout:120000,polling:250});
  settled=true;
}catch(e){timeout=String(e)}
await page.waitForTimeout(1000);
const out=await page.evaluate(()=>({
  displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
  coverage:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,
  finalSpread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,
  fineSpread:window.EARTHLINE_FINE_DISPERSION_REBALANCE_16778||null,
  spatialSelection:window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null,
  supportedCapacity:window.EARTHLINE_SUPPORTED_CAPACITY_16843||null,
  fineRefinement:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,
  gapRefinement:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,
  lateGap:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null,
  supertile:window.EARTHLINE_STATEWIDE_SUPERTILE_16839||null,
  swaleAudit:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
  scoreOrder:window.EARTHLINE_REGIONAL_SCORE_ORDER_16717||null,
  landValidity:window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null,
  standardAudit:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
  camera:window.EARTHLINE_REGIONAL_CAMERA_AUDIT_16147||null,
  runStatus:document.getElementById('runBtn')?.getAttribute('aria-busy')||null,
  tier:document.documentElement.dataset.earthlineAnalysisTier||''
}));
out.settled=settled;out.timeout=timeout;out.elapsedMs=Date.now()-started;out.errors=errors;
fs.writeFileSync('iowa-regional-audit.json',JSON.stringify(out,null,2));
await page.screenshot({path:'iowa-regional-audit.png',fullPage:false});
console.log('EARTHLINE_IOWA_REGIONAL_AUDIT '+JSON.stringify(out));
await browser.close();
