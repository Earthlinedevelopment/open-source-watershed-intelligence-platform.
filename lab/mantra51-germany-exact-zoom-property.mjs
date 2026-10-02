import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.goto('https://earthlinedevelopment.org/?de_exact='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
const run=async q=>page.evaluate(q=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
},q);
await run('germany country');
await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_TERMINAL_16539?.status==='published',null,{timeout:180000,polling:250});
await page.waitForTimeout(1500);
console.log('STEP regional '+JSON.stringify(await page.evaluate(()=>({
  tabs:[...document.querySelectorAll('#earthlineRegionalCorridorTabs16323 button')].map(b=>String(b.textContent||'').trim()),
  propertyTarget:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  tier:document.documentElement.dataset.earthlineAnalysisTier||''
}))));

const tab=page.locator('#earthlineRegionalCorridorTabs16323 button').first();
if(await tab.count()){ console.log('STEP click-tab '+await tab.innerText()); await tab.click(); }
else {
  const hit=page.locator('.earthline-swale-hit-16070,.earthline-swale-label-16149').first();
  if(await hit.count()){console.log('STEP click-map-hit'); await hit.click({force:true});}
}
await page.waitForTimeout(600);
console.log('STEP after-tab '+JSON.stringify(await page.evaluate(()=>({
  detail:document.getElementById('earthlineCorridorDetail16149')?.innerText||'',
  buttons:[...document.querySelectorAll('#earthlineCorridorDetail16149 button')].map(b=>String(b.textContent||'').trim()),
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null
}))));

const zoom=page.getByRole('button',{name:/zoom to location/i}).first();
console.log('STEP zoom-count '+await zoom.count());
if(await zoom.count()) await zoom.click();
await page.waitForTimeout(1200);
console.log('STEP after-zoom '+JSON.stringify(await page.evaluate(()=>({
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  tier:document.documentElement.dataset.earthlineAnalysisTier||'',
  declare:String(document.getElementById('earthlineDeclareProperty16169')?.textContent||'').trim(),
  status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()
}))));

const prop=page.locator('#earthlineDeclareProperty16169').first();
console.log('STEP property-count '+await prop.count());
if(await prop.count()) await prop.click();
await page.waitForTimeout(12000);
console.log('STEP final '+JSON.stringify(await page.evaluate(()=>({
  displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
  audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
  safe:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  swales:Array.isArray(M?.swales)?M.swales.length:null,
  tier:document.documentElement.dataset.earthlineAnalysisTier||'',
  state:document.documentElement.dataset.earthlinePropertyRunState||'',
  status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()
}))));
await browser.close();