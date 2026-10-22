import { chromium } from 'playwright';
const BASE='http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true,channel:'chrome'});
for(const name of ['Iowa','Arkansas']){
  const context=await browser.newContext({viewport:{width:1800,height:1000}});
  const page=await context.newPage();
  await page.route('https://api.mapbox.com/**',async route=>{
    const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
    await route.continue({headers});
  });
  const t0=Date.now();
  await page.goto(BASE+'?balance='+name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});
  await page.locator('#searchInput').fill(name);await page.waitForTimeout(700);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  if(await opts.count())await opts.first().click({force:true});else await page.locator('#searchInput').press('Enter').catch(()=>{});
  await page.waitForTimeout(120);await page.locator('#runBtn').click({force:true});
  await page.waitForFunction(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    return String(d&&(d.tier||d.mode)||'').toLowerCase()==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
  },null,{timeout:90000,polling:150});
  await page.waitForFunction(()=>{const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return sw.length>0},null,{timeout:20000,polling:100});
  await page.waitForTimeout(700);
  const r=await page.evaluate(()=>{
    const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    const vals=sw.map(f=>Number(f?.properties?.score)).filter(Number.isFinite).sort((a,b)=>a-b);
    const pct=(a,p)=>a.length?a[Math.min(a.length-1,Math.floor((a.length-1)*p))]:null;
    const spatial=window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null;
    const rows=spatial?.rows||[];
    const rs=rows.map(x=>Number(x.score)).filter(Number.isFinite).sort((a,b)=>a-b);
    return {
      count:sw.length,
      score:{min:vals[0]??null,p10:pct(vals,.1),median:pct(vals,.5),p90:pct(vals,.9),max:vals.at(-1)??null},
      candidateBins:spatial?.candidateBins||null,reserved:spatial?.reserved||0,capacity:spatial?.capacity||0,
      minimumSubcellReserved:rows.filter(x=>x.minimumSubcellReserve16779).length,
      reservedScore:{min:rs[0]??null,p10:pct(rs,.1),median:pct(rs,.5),p90:pct(rs,.9),max:rs.at(-1)??null},
      fine:window.EARTHLINE_FINE_DISPERSION_REBALANCE_16778||null,
      spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null
    };
  });
  await page.screenshot({path:'regional-'+name.toLowerCase()+'.png',fullPage:false});
  console.log('EARTHLINE_BALANCE '+JSON.stringify({name,elapsedMs:Date.now()-t0,result:r}));
  await context.close();
}
await browser.close();
