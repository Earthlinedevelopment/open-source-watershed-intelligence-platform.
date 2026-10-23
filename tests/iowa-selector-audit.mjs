import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
await page.route('https://api.mapbox.com/**',async route=>{
  const h={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
  await route.continue({headers:h});
});
await page.goto('http://127.0.0.1:8787/?sel='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
const input=page.locator('#searchInput'); await input.fill('Iowa'); await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(200); await page.locator('#runBtn').click({force:true});
await page.waitForFunction(()=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return d&&String(d.tier||d.mode).toLowerCase()==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';},null,{timeout:90000,polling:200});
const out=await page.evaluate(()=>({
  generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
  spatial:window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null,
  fine:window.EARTHLINE_FINE_DISPERSION_REBALANCE_16778||null,
  finalSpread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,
  scoreOrder:window.EARTHLINE_REGIONAL_SCORE_ORDER_16717||null,
  capacity:window.EARTHLINE_SUPPORTED_CAPACITY_16843||null,
  opportunity:window.EARTHLINE_OPPORTUNITY_BALANCE_16836||null,
  displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null
}));
console.log('EARTHLINE_IOWA_SELECTOR '+JSON.stringify(out));
await browser.close();