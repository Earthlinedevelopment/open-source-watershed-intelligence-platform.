import {chromium} from 'playwright';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const candidate=process.env.CANDIDATE==='1';
const html=candidate?readFileSync('index.html','utf8'):null;
const queries=['Alaska','Arizona'];const rows=[];
mkdirSync('artifacts/mantra91',{recursive:true});
const browser=await chromium.launch({headless:true});
for(const query of queries){
 const context=await browser.newContext({viewport:{width:1600,height:950}});
 const page=await context.newPage(),errors=[],bad=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400)bad.push({code:r.status(),url:r.url()})});
 if(candidate)await page.route('**/*',async route=>{
  const req=route.request();
  if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE))await route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
  else await route.continue();
 });
 let initAt=Date.now(),clickedAt=null,doneAt=null,failure=null;
 try{
   await page.goto(BASE+'?m91='+query+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForSelector('#searchInput',{timeout:15000});
   clickedAt=Date.now();
   await page.evaluate(q=>{const i=document.getElementById('searchInput');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('runBtn').click()},query);
   await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:90000,polling:200});
   doneAt=Date.now();
 }catch(e){failure=String(e)}
 const snap=await page.evaluate(()=>{
 const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
 const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,land=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null;
 const spread=window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,geo=window.EARTHLINE_REGIONAL_GEOMETRY_M84||null;
 return {pkg:pkg?{profileId:pkg.profileId,center:pkg.center,extent:pkg.regionalExtent,boundaryPolygons:pkg.boundary?.prepared?.polygons?.length}:null,
 bounds:window.EARTHLINE_REGIONAL_ANALYSIS_EXTENT_16712||null,cam:window.EARTHLINE_REGIONAL_CAMERA_AUDIT_16147||null,
 perf:p,publication:pub,land,spread:spread?{finalCellKeys:spread.finalCellKeys,finalCorridorCount:spread.finalCorridorCount,candidateCellKeys:spread.candidateCellKeys}:null,
 fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781?{selected:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781.selected?.length,added:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781.added,unresolvedAfter:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781.unresolvedAfter?.length}:null,
 supertile:window.EARTHLINE_STATEWIDE_SUPERTILE_16839?{gaps:window.EARTHLINE_STATEWIDE_SUPERTILE_16839.gaps,groups:window.EARTHLINE_STATEWIDE_SUPERTILE_16839.groups,added:window.EARTHLINE_STATEWIDE_SUPERTILE_16839.added,failed:window.EARTHLINE_STATEWIDE_SUPERTILE_16839.failed,elapsedMs:window.EARTHLINE_STATEWIDE_SUPERTILE_16839.elapsedMs}:null,
 error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:document.getElementById('earthlineVermontStatus16147')?.textContent||'',tier:document.documentElement.dataset.earthlineAnalysisTier||''
 }
 }).catch(e=>({evaluationError:String(e)}));
 const row={query,candidate,loadMs:clickedAt-initAt,runMs:doneAt?doneAt-clickedAt:null,elapsedMs:Date.now()-initAt,failure,snap,errors:errors.slice(-10),bad:bad.slice(-20)};
 rows.push(row);
 console.log('M91_DIAGNOSTIC '+JSON.stringify(row).slice(0,14000));
 await page.screenshot({path:'artifacts/mantra91/'+query.toLowerCase()+(candidate?'-candidate':'-live')+'.png'}).catch(()=>{});
 await context.close();
}
writeFileSync('artifacts/mantra91/'+(candidate?'candidate':'live')+'.json',JSON.stringify(rows,null,2));
await browser.close();
if(rows.some(r=>r.failure||r.snap?.error))process.exitCode=1;
