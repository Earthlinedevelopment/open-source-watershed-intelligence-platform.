import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const scenarios={
 vermont:{query:'Rutland, Vermont',lng:-72.455,lat:43.8811,expectSteep:true},
 iowa:{query:'Iowa',lng:-93.52,lat:42.08,expectSteep:false},
 texas:{query:'Texas',lng:-96.47,lat:29.2,expectSteep:false}
};
const key=process.env.TEST_CASE||'vermont',pt=scenarios[key];
if(!pt)throw Error('Unknown Property scenario '+key);
const baseline=await readFile('/tmp/m130-parent.html'),candidate=await readFile('index.html');
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
await mkdir('artifacts/m130/'+key,{recursive:true});
const result={key,scenario:pt,checks:{},runs:[]};
async function one(label,html){
 const page=await browser.newPage({viewport:{width:1800,height:1000},serviceWorkers:'block'});
 const r={label,errors:[]};page.on('pageerror',e=>r.errors.push(String(e)));
 await page.route('**/*',route=>route.request().isNavigationRequest()&&route.request().resourceType()==='document'?route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html,headers:{'cache-control':'no-store'}}):route.continue());
 try{
  await page.goto('https://earthlinedevelopment.org/?m130='+key+'-'+label,{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('#searchInput').fill(pt.query);
  if(key==='vermont'){
   await page.waitForFunction(()=>document.querySelector('#earthlineSearchSuggestions15970')?.classList.contains('open'),null,{timeout:18000});
   await page.locator('#earthlineSearchSuggestions15970 button[data-query]').first().click();
  }else await page.locator('#searchInput').press('Enter');
  await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970,null,{timeout:115000});
  await page.waitForTimeout(1200);
  await page.evaluate(p=>{const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;m.stop();m.jumpTo({center:[p.lng,p.lat],zoom:17.7});},pt);
  await page.waitForFunction(()=>{const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;return Math.abs(m.getZoom()-17.7)<.1;},null,{timeout:15000});
  await page.waitForTimeout(2200);
  r.preclick=await page.evaluate(()=>({target:window.EARTHLINE_PROPERTY_TARGET_16201,zoom:(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap).getZoom()}));
  await page.locator('#earthlineDeclareProperty16169').click({timeout:16000});
  await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:110000});
  r.snap=await page.evaluate(()=>{
    const Mx=(typeof M!=='undefined'?M:window.M)||{},e=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{},a=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||{},
      sw=Array.isArray(Mx.swales)?Mx.swales:[],d=Mx.swaleDiagnostics?.stage||{},sc=Mx.safetyAudit15806||{};
    const nums=sw.map(s=>Number(s.slope)).filter(Number.isFinite).sort((a,b)=>a-b);
    const maxPoint=sw.reduce((mx,s)=>Math.max(mx,...(s.pts||[]).map(p=>{
      try{return Number(slopePct(Math.round(Number(p[0])),Math.round(Number(p[1]))))}catch{return Infinity}
    })),0);
    return {settled:e.settled,result:e.result,error:e.error,center:e.center,
      rawCount:sw.length,safeCount:a.safeCount||0,published:a.published||false,
      slopeMax:nums.at(-1)??null,slopeMedian:nums[Math.floor(nums.length/2)]??null,maxPointSlope:maxPoint,
      rejectAbove4:d.rejectSlopeAbove4M130||0,rejectSpacing:d.rejectFinalSpacing||0,afterDedupe:d.afterDedupe||0,
      safetyVerified:sc.verified===true,unsafeSegments:sc.clearance?.unsafeSegments??null,
      acceptedIntersections:sc.clearance?.acceptedIntersections??null,
      sourceState:Mx.noBuildProvenance15843?.sourceStateFingerprint,
      integrity:Mx.propertyRunFailure16539?.audit||null,
      status:document.getElementById('earthlineVermontStatus16147')?.textContent?.slice(0,240)};
  });
  await page.screenshot({path:'artifacts/m130/'+key+'/'+label+'.png',timeout:20000});
 }catch(e){r.failure=String(e)}
 await page.close();return r;
}
const parent=await one('accepted',baseline),changed=await one('candidate',candidate);
result.runs=[parent,changed];
const b=parent.snap||{},c=changed.snap||{};
result.checks={
 baselineValidOrEvidenceBlocked:(b.rawCount>0&&b.result===true)||b.error==='vector-exclusion-coverage-unverified',
 candidateCompleted:!changed.failure&&c.settled===true&&!/location integrity/i.test(String(c.error||'')),
 candidateNoSteepSegments:c.rawCount===0||(c.slopeMax<=4&&c.maxPointSlope<=4.000001),
 countsNotIncreased:b.result===true?c.rawCount<=b.rawCount:true,
 noNewPageErrors:changed.errors.length<=parent.errors.length,
 exclusionsPreserved:c.safeCount===0||(c.safetyVerified&&c.unsafeSegments===0&&c.acceptedIntersections===0),
 scienceMaskPresent:!!c.sourceState,
 userVisibleResult:!!c.status,
 steepSiteReduced:pt.expectSteep?c.rawCount<b.rawCount:true,
 flatOpportunityPreserved:pt.expectSteep?true:(c.rawCount>0&&c.result===true)
};
result.passed=Object.values(result.checks).every(Boolean);
await writeFile('artifacts/m130/'+key+'/result.json',JSON.stringify(result,null,2));
console.log('M130_PROPERTY_COMPARISON '+JSON.stringify({key,checks:result.checks,baseline:b,candidate:c,failures:[parent.failure,changed.failure],passed:result.passed}));
await browser.close();
if(!result.passed)process.exitCode=1;
