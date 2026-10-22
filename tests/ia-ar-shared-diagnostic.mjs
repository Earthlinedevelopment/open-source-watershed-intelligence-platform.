import { chromium } from 'playwright';
const BASE='http://127.0.0.1:8787/';
const cases=['Iowa','Arkansas'];
const browser=await chromium.launch({headless:true,channel:'chrome'});
for(const name of cases){
  const context=await browser.newContext({viewport:{width:1800,height:1000}});
  const page=await context.newPage();
  await page.route('https://api.mapbox.com/**',async route=>{
    const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
    await route.continue({headers});
  });
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  const t0=Date.now();
  await page.goto(BASE+'?diag='+name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});
  await page.locator('#searchInput').fill(name);
  await page.waitForTimeout(700);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  if(await opts.count())await opts.first().click({force:true});else await page.locator('#searchInput').press('Enter').catch(()=>{});
  await page.waitForTimeout(120);
  await page.locator('#runBtn').click({force:true});
  await page.waitForFunction(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    return String(d&&(d.tier||d.mode)||'').toLowerCase()==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
  },null,{timeout:90000,polling:150});
  await page.waitForFunction(()=>{const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return sw.length>0;},null,{timeout:20000,polling:100});
  const regional=await page.evaluate(()=>{
    const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    const vals=sw.map(f=>Number(f?.properties?.score)).filter(Number.isFinite).sort((a,b)=>a-b);
    const pct=(a,p)=>a.length?a[Math.min(a.length-1,Math.floor((a.length-1)*p))]:null;
    return {
      featureCount:sw.length,
      score:{min:vals[0]??null,p10:pct(vals,.1),median:pct(vals,.5),p90:pct(vals,.9),max:vals.at(-1)??null},
      spatial:window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null,
      fine:window.EARTHLINE_FINE_DISPERSION_REBALANCE_16778||null,
      spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null
    };
  });
  const surfaces=page.locator('.earthline-swale-hit-16070:visible,.earthline-swale-label-16149:visible');
  let opened=false;
  for(let i=0;i<Math.min(await surfaces.count(),8)&&!opened;i++){
    try{await surfaces.nth(i).click({force:true,timeout:2500})}catch(_){}
    await page.waitForTimeout(200);
    opened=await page.evaluate(()=>!!document.getElementById('earthlineCorridorDetail16149')?.classList?.contains('open'));
  }
  if(!opened)throw new Error(name+' no Regional corridor opened');
  const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
  await zoom.click({force:true});
  await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&!b.disabled},null,{timeout:20000,polling:100});
  const p0=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click({force:true});
  await page.waitForFunction(()=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const state=String(document.documentElement.dataset.earthlinePropertyRunState||'').toLowerCase();
    return a?.settled===true&&a?.result===true&&state!=='running';
  },null,{timeout:20000,polling:100});
  await page.waitForTimeout(700);
  const property=await page.evaluate(()=>({
    audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
    safe:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
    tier:document.documentElement.dataset.earthlineAnalysisTier||'',
    runState:document.documentElement.dataset.earthlinePropertyRunState||''
  }));
  console.log('EARTHLINE_IA_AR '+JSON.stringify({name,regionalMs:p0-t0,propertyMs:Date.now()-p0,regional,property,errors}));
  await context.close();
}
await browser.close();
