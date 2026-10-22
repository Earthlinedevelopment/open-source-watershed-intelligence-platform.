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
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE+'?perf='+name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});
  await page.locator('#searchInput').fill(name);
  await page.waitForTimeout(700);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  if(await opts.count())await opts.first().click({force:true});else await page.locator('#searchInput').press('Enter').catch(()=>{});
  await page.waitForTimeout(120);
  const t0=Date.now();
  await page.locator('#runBtn').click({force:true});
  await page.waitForFunction(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    return String(d&&(d.tier||d.mode)||'').toLowerCase()==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
  },null,{timeout:90000,polling:100});
  await page.waitForTimeout(200);
  const out=await page.evaluate(()=>{
    const m=(typeof M!=='undefined'&&M)||{};
    const interesting={};
    for(const k of Object.keys(m).filter(k=>/timing|perf|duration|regional|terrain|dem|flow|swale|hydro|water/i.test(k))){
      const v=m[k];
      if(v==null||typeof v==='function')continue;
      try{
        if(typeof v==='number'||typeof v==='string'||typeof v==='boolean')interesting[k]=v;
        else if(Array.isArray(v))interesting[k]={type:'array',length:v.length};
        else if(typeof v==='object')interesting[k]=JSON.parse(JSON.stringify(v));
      }catch(_){}
    }
    const globals={};
    for(const k of Object.keys(window).filter(k=>/TIMING|PERF|REGIONAL.*AUDIT|LOADING_AUDIT|RUN_AUDIT|TERRAIN.*AUDIT|DEM.*AUDIT/i.test(k))){
      try{const v=window[k];if(v&&typeof v==='object')globals[k]=JSON.parse(JSON.stringify(v));}catch(_){}
    }
    return {
      displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
      loading:window.EARTHLINE_LOADING_AUDIT_16167||null,
      spatial:window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null,
      finalSpread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,
      model:interesting,globals
    };
  });
  console.log('EARTHLINE_IA_AR_PERF '+JSON.stringify({name,regionalMs:Date.now()-t0,out,errors}));
  await context.close();
}
await browser.close();
