import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { resolve,extname } from 'node:path';
const root=process.cwd(),origin='https://earthlinedevelopment.org';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.py':'text/plain; charset=utf-8'};
const states=['Vermont','New York','Massachusetts','Texas','Florida','Iowa','Arkansas','Nebraska','California','Colorado','Oklahoma','Arizona'];
const browser=await chromium.launch({headless:true});
const rows=[];
for(const query of states){
 const context=await browser.newContext({viewport:{width:1798,height:831},serviceWorkers:'block'});
 await context.route(origin+'/**',async route=>{
  const u=new URL(route.request().url());const p=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html';const f=resolve(root,p);
  if(f.startsWith(root)&&existsSync(f))return route.fulfill({status:200,path:f,contentType:mime[extname(f)]||'application/octet-stream',headers:{'cache-control':'no-store'}});
  return route.continue();
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(origin+'/?regional17604='+encodeURIComponent(query)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 await page.locator('#searchInput').fill(query);await page.waitForTimeout(650);
 const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').first();if(await opt.count())await opt.click().catch(()=>{});
 const run=page.locator('#runBtn');if(await run.isVisible()&&!await run.evaluate(b=>b.dataset.busy==='1'||b.disabled))await run.click();
 await page.waitForFunction(q=>{
   const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
   const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
   const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
   return !!perf&&!!root&&String(root.query||'').toLowerCase().includes(q.toLowerCase())&&/screening published/i.test(status);
 },query,{timeout:120000,polling:120});
 await page.waitForTimeout(600);
 const snap=await page.evaluate(query=>{
   const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||{};
   const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
   const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||{};
   const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||{};
   const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||{};
   const aquifer=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16700||window.EARTHLINE_AQUIFER_AUDIT_16472||null;
   return {query,tier:String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase(),d,pub,flow,boundary,root,aquifer};
 },query);
 const generated=Number(snap.pub?.generated||0);
 const visible=Number(snap.d?.swaleLines||0);
 const water=Number(snap.d?.waterPaths||0);
 const arrows=Number(snap.d?.directionArrows||0);
 const contours=Number(snap.d?.contourLines||0);
 const labels=Number(snap.d?.elevationLabels||0);
 const unsafe=Number(snap.flow?.unsafeSegments||0);
 const outside=Number(snap.boundary?.outsideAfterClip?.swales||0);
 const rootFail=Array.isArray(snap.root?.rankedCauses)&&snap.root.rankedCauses.some(r=>r.status==='critical'||r.status==='fail');
 const pass=snap.tier==='regional'&&generated>0&&visible>0&&visible===generated&&water>0&&arrows>0&&contours>0&&labels>0&&unsafe===0&&outside===0&&!rootFail&&!errors.length;
 const row={query,pass,generated,visible,water,arrows,contours,labels,unsafe,outside,rootPass:snap.root?.pass??null,errors};
 rows.push(row);console.log('EARTHLINE_REGIONAL_17604 '+JSON.stringify(row));
 await context.close();
}
await browser.close();
const summary={pass:rows.every(r=>r.pass),rows};
console.log('EARTHLINE_REGIONAL_17604_SUMMARY '+JSON.stringify(summary));
if(!summary.pass)process.exitCode=1;
