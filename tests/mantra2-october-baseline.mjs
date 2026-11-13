import {chromium} from 'playwright';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mantra2-october-baseline';
mkdirSync(OUT,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const expected=readFileSync('index.html');
const expectedHash=sha(expected);
const runs=[{id:'iowa-regional',search:'Iowa'}, {id:'iowa-property',search:'Iowa',lat:42.13000,lng:-93.68000}, {id:'arizona-property',search:'Arizona',lat:34.21572,lng:-111.93073}];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const rows=[];
function n(v){return Number.isFinite(Number(v))?Number(v):null}
for(const test of runs){
 const ctx=await browser.newContext({viewport:{width:1600,height:950}});
 const page=await ctx.newPage(); const errors=[],consoleErrors=[],requests=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
 page.on('requestfailed',r=>requests.push({url:r.url(),error:r.failure()?.errorText||'failed'}));
 const row={test,expectedCommit:'a4824c090014c006aede0e67797264a1f999fda1',expectedHtmlSha256:expectedHash,checks:{},errors,consoleErrors,requests,verdict:'UNVERIFIED'};
 try{
   const response=await page.goto(BASE+'?mantra2audit='+Date.now(),{waitUntil:'domcontentloaded',timeout:65000});
   if(!response)throw Error('No document response');
   row.receivedHtmlSha256=sha(await response.body());
   row.httpStatus=response.status();
   row.identityMatchesOctober=row.receivedHtmlSha256===expectedHash;
   if(!row.identityMatchesOctober)throw Error('LIVE_HTML_DOES_NOT_MATCH_PINNED_OCTOBER; refusing to label measurements as baseline');
   await page.locator('#searchInput').fill(test.search,{timeout:30000});
   await page.locator('#searchInput').press('Enter',{timeout:30000});
   row.searchSubmission='Enter from searchInput';
   await page.waitForFunction(()=>!!window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167 || !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970 || !!window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020,null,{timeout:80000}).catch(()=>null);
   await page.waitForTimeout(3500);
   if(test.lat!==undefined){
     await page.evaluate(t=>{
       const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
       if(!map)throw Error('Map unavailable');
       map.stop(); map.jumpTo({center:[t.lng,t.lat],zoom:17.7});
     },test);
     await page.waitForTimeout(2500);
     const prep=await page.evaluate(t=>{
       let targeted=false;
       if(typeof window.earthlineSetPropertyTarget16201==='function')targeted=!!window.earthlineSetPropertyTarget16201({lng:t.lng,lat:t.lat,source:'mantra2-baseline'},{openPanel:false});
       return {targeted,button:!!document.getElementById('earthlineDeclareProperty16169')};
     },test);
     row.preparation=prep;
     if(!prep.button)throw Error('Property control missing');
     await page.locator('#earthlineDeclareProperty16169').click({timeout:15000});
     await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&document.documentElement.dataset.earthlinePropertyRunState!=='running',null,{timeout:100000}).catch(()=>null);
     await page.waitForTimeout(2000);
   }
   row.measured=await page.evaluate(t=>{
     const m=(typeof M!=='undefined'?M:window.M)||{};
     const prop=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
     const reg=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
     const overlay=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
     const safety=m.safetyAudit15806||null,mask=m.noBuildProvenance15843||null;
     const features=m.authoritativeSafeSwales15815?.features||null;
     const engine=Array.isArray(m.swales)?m.swales:null;
     // October's slopePct is closure-private. Only sample data already attached
     // to published corridors; never imply terrain raster or corridor maxima
     // have been measured when only a per-swale scalar is available.
     const published=Array.isArray(features)?features:null;
     const slopeOf=f=>{
       const v=f?.slope??f?.properties?.slope;
       if(v===null||v===undefined||v==='')return null;
       const value=Number(v);return Number.isFinite(value)?value:null;
     };
     const publishedSlopes=published?published.map(slopeOf).filter(v=>v!==null):[];
     const sampledSwaleMaxSlopePct=publishedSlopes.length?Math.max(...publishedSlopes):null;
     const sampledSwaleMinSlopePct=publishedSlopes.length?Math.min(...publishedSlopes):null;
     const sampledSwaleMeanSlopePct=publishedSlopes.length?publishedSlopes.reduce((a,b)=>a+b,0)/publishedSlopes.length:null;
     const pick=(a,k)=>a&&Object.prototype.hasOwnProperty.call(a,k)?a[k]:null;
     return {
       analysisTier:document.documentElement.dataset.earthlineAnalysisTier||null,
       regionalGenerated:pick(reg,'generated'),regionalDrawn:pick(overlay,'swaleLines'),
       regionalLabels:pick(overlay,'swaleGradeLabels'),regionalPaths:pick(overlay,'waterPaths'),
       propertySettled:pick(prop,'settled'),propertyResult:pick(prop,'result'),
       propertyCenter:pick(prop,'center'),publishedSwales:features?.length??null,
       engineSwales:engine?.length??null,
       publishedSwaleSlopeSampleCount:publishedSlopes.length,
       publishedSwaleSlopeCount:published?.length??null,
       publishedSwaleMinSlopePct:sampledSwaleMinSlopePct,
       publishedSwaleMaxSlopePct:sampledSwaleMaxSlopePct,
       publishedSwaleMeanSlopePct:sampledSwaleMeanSlopePct,
       slopeEvidenceNote:publishedSlopes.length?'Per-published-swale scalar; NOT the maximum along a route':'UNKNOWN: neither published swale slope scalars nor necessarily route sampling available',
       routeMaxSlopePct:pick(safety,'routeMaxSlopePct'),
       routeAverageSlopePct:pick(safety,'routeAverageSlopePct'),
       maximumSustainedAbove4Pct:pick(safety,'maximumSustainedAbove4Pct'),
       roadIntersections:pick(safety,'roadIntersections'),
       waterIntersections:pick(safety,'waterIntersections'),
       spacingViolationCount:pick(safety,'spacingViolationCount'),
       scientificSafetyVerified:pick(safety,'verified'),
       safetyAudit:safety,maskProvenance:mask,
       exclusionProvider:pick(mask,'sourceTier'),
       regionalError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
       propertyError:window.EARTHLINE_PROPERTY_LAST_ERROR_16173||null,
       swaleDiagnostics:m.swaleDiagnostics?.stage||null
     };
   },test);
   row.verdict='MEASURED_PARTIAL_UNTIL_SAFETY_FIELDS_CONFIRMED';
   if(!row.measured||test.lat!==undefined&&row.measured.propertySettled!==true)row.verdict='FAILED_OR_INCOMPLETE';
   if(test.lat!==undefined){
     const keys=['roadIntersections','waterIntersections','spacingViolationCount'];
     row.missingSafetyMetrics=keys.filter(k=>row.measured[k]===null);
     if(row.measured.routeMaxSlopePct===null&&row.measured.publishedSwaleMaxSlopePct===null)row.missingSafetyMetrics.push('slope: no route maximum or published swale slope');
     if(row.measured.routeAverageSlopePct===null)row.missingSafetyMetrics.push('routeAverageSlopePct');
     if(row.measured.maximumSustainedAbove4Pct===null)row.missingSafetyMetrics.push('maximumSustainedAbove4Pct');
     if(row.missingSafetyMetrics.length)row.verdict='SAFETY_METRICS_UNVERIFIED';
   }
 }catch(e){row.error=String(e);row.verdict='FAILED_OR_UNVERIFIED'}
 try{await page.screenshot({path:OUT+'/'+test.id+'.png',timeout:15000})}catch(e){row.screenshotError=String(e)}
 rows.push(row);await ctx.close();
 console.log('MANTRA2_BASELINE '+JSON.stringify({test:test.id,verdict:row.verdict,identityMatchesOctober:row.identityMatchesOctober,metrics:row.measured,error:row.error}).slice(0,18000));
}
await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));
if(rows.some(r=>r.verdict!=='MEASURED_PARTIAL_UNTIL_SAFETY_FIELDS_CONFIRMED'))process.exitCode=1;
