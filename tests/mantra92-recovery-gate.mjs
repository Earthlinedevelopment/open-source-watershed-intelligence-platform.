import { chromium } from 'playwright';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

// Compare the actual live origin with exactly this candidate artifact.
// Never change the production branch or bypass the browser renderer.
const origin='https://earthlinedevelopment.org/';
const candidate=process.env.CANDIDATE==='1';
const html=candidate?readFileSync('index.html','utf8'):null;
const queries=['Alaska','Arizona','Arkansas','Iowa'];
const rows=[];
mkdirSync('artifacts/mantra92/recovery',{recursive:true});
const browser=await chromium.launch({headless:true});
for(const query of queries){
 const context=await browser.newContext({viewport:{width:1600,height:950}});
 const page=await context.newPage(),errors=[],bad=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400)bad.push({code:r.status(),url:r.url()})});
 if(candidate)await page.route('**/*',async route=>{
  const req=route.request();
  if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(origin))
   return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
  return route.continue();
 });
 let started=Date.now(),clicked=0,failure=null;
 try{
  await page.goto(origin+'?m92recovery='+query+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:20000});
  clicked=Date.now();
  await page.evaluate(q=>{
   const el=document.getElementById('searchInput');
   el.value=q;el.dispatchEvent(new Event('input',{bubbles:true}));
   el.dispatchEvent(new Event('change',{bubbles:true}));
   document.getElementById('runBtn').click();
  },query);
  await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
    !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:90000,polling:250});
 }catch(e){failure=String(e)}
 const snap=await page.evaluate(()=>{
  const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
  const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
  const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
  const mask=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null;
  return {
   profileId:pkg?.profileId,center:pkg?.center,bbox:pkg?.regionalExtent?.bbox,
   coreMs:perf?.phaseTotalsMs?.coreTotalMs,phases:perf?.phaseTotalsMs,
   swales:pub?.generated,sourceSwales:pub?.sourceFeatures,overlaySwales:pub?.overlaySwaleLines,
   waterPaths:perf?.waterPaths,invalidLandCells:mask?.rasterizedInvalidWaterCellCount,
   sourceAudit:window.EARTHLINE_US_STATE_BOUNDARY_CACHE_AUDIT_M89||null,
   tier:document.documentElement.dataset.earthlineAnalysisTier,
   error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
   status:document.getElementById('earthlineVermontStatus16147')?.textContent||''
  };
 }).catch(e=>({evaluationError:String(e)}));
 const row={query,candidate,elapsedMs:Date.now()-started,loadMs:clicked?clicked-started:null,failure,snap,errors:errors.slice(-5),bad:bad.slice(-10)};
 rows.push(row);
 console.log('M92_RECOVERY '+JSON.stringify(row));
 await page.screenshot({path:'artifacts/mantra92/recovery/'+query.toLowerCase()+(candidate?'-candidate':'-live')+'.png'}).catch(()=>{});
 await context.close();
}
await browser.close();
writeFileSync('artifacts/mantra92/recovery/'+(candidate?'candidate':'live')+'.json',JSON.stringify(rows,null,2));
const violations=[];
for(const row of rows){
 const expected={Alaska:'us-ak',Arizona:'us-az',Arkansas:'us-ar',Iowa:'us-ia'}[row.query];
 const reasons=[];
 if(row.failure||row.snap?.error||row.snap?.evaluationError)reasons.push('analysis failed');
 if(row.errors.length)reasons.push('uncaught browser errors');
 if(row.snap?.profileId!==expected)reasons.push('wrong authoritative profile');
 if(row.snap?.tier!=='regional')reasons.push('not Regional');
 if(!Number.isFinite(row.snap?.coreMs))reasons.push('missing core timing');
 if(row.snap?.swales!==row.snap?.sourceSwales||row.snap?.swales!==row.snap?.overlaySwales)
  reasons.push('source/render swale mismatch');
 if(candidate){
  if(row.snap?.coreMs>15000)reasons.push('core exceeded 15s ceiling');
  if(!Number.isInteger(row.snap?.swales)||row.snap.swales<=0)reasons.push('no swales published');
  const baseline=JSON.parse(readFileSync('artifacts/mantra92/recovery/live.json','utf8')).find(x=>x.query===row.query);
  if(!baseline)reasons.push('missing same-origin baseline');
  else if(row.query!=='Alaska'){
   if(row.snap?.swales!==baseline.snap?.swales)reasons.push('unapproved swale count change');
   if(row.snap?.waterPaths!==baseline.snap?.waterPaths)reasons.push('unapproved water count change');
  }
  if(row.query==='Alaska'){
   const width=row.snap?.bbox?.[2]-row.snap?.bbox?.[0];
   if(!(width>18))reasons.push('Alaska governed bbox is truncated');
   if(row.snap?.center?.lng>-140)reasons.push('Alaska center still in southeast-only fallback');
  }
 }
 console.log('M92_RECOVERY_GATE '+JSON.stringify({query:row.query,candidate,coreMs:row.snap?.coreMs,reasons}));
 if(candidate&&reasons.length)violations.push({query:row.query,reasons});
}
if(violations.length){console.error('M92_RECOVERY_FAIL '+JSON.stringify(violations));process.exitCode=1;}
