import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE='http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const results=[];
for(const name of ['Iowa','Arkansas']){
  const context=await browser.newContext({viewport:{width:1800,height:1000}});
  const page=await context.newPage();
  await page.route('https://api.mapbox.com/**',async route=>{
    const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
    await route.continue({headers});
  });
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE+'?visible='+name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});
  await page.locator('#searchInput').fill(name);await page.waitForTimeout(700);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  if(await opts.count())await opts.first().click({force:true});else await page.locator('#searchInput').press('Enter').catch(()=>{});
  await page.waitForTimeout(120);
  const t0=Date.now(); await page.locator('#runBtn').click({force:true});
  await page.waitForFunction(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    return String(d&&(d.tier||d.mode)||'').toLowerCase()==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
  },null,{timeout:90000,polling:100});
  await page.waitForTimeout(250);
  const snap=await page.evaluate(()=>({
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
    spatial:window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null,
    spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null
  }));
  const generated=Number(snap.display?.generatedSwales||0),visible=Number(snap.display?.swaleLines||0),core=Number(snap.perf?.totalMs||Infinity);
  const failures=[];
  if(!(generated>0))failures.push('no generated Regional swales');
  if(snap.display?.corridorGeometryVisible!==true)failures.push('corridor geometry not visible');
  if(visible!==generated)failures.push('visible swale count '+visible+' != generated '+generated);
  if(!(core<=15000))failures.push('Regional core '+core+'ms > 15000ms');
  if(errors.length)failures.push('page errors: '+errors.join(' | '));
  await page.screenshot({path:'regional-visible-'+name.toLowerCase()+'.png'});
  const row={name,pass:failures.length===0,failures,elapsedMs:Date.now()-t0,generated,visible,coreMs:core,display:snap.display,spatial:snap.spatial,spread:snap.spread,errors};
  results.push(row);console.log('EARTHLINE_17704_CASE '+JSON.stringify(row));
  await context.close();
}
fs.writeFileSync('ia-ar-regional-visible-17704.json',JSON.stringify({pass:results.every(r=>r.pass),results},null,2));
await browser.close();
if(results.some(r=>!r.pass))process.exit(1);
