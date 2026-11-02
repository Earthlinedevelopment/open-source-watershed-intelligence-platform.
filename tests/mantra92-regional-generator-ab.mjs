import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
// M92 controlled generator A/B. Browser uses identical production origin, data,
// build and all other components. No production file or renderer is changed.
const BASE='https://earthlinedevelopment.org/';
const base=readFileSync('index.html','utf8');
const conditional='if(focusMode||preferredEligibleCount16539<36){';
const conditionalOld='if(!focusMode||preferredEligibleCount16539<36){';
const cap='if(leftM+d>8000)break;';
const capRight='if(rightM+d>8000)break;';
for(const [needle,n] of [[conditional,1],[cap,1],[capRight,1]]){
  const count=base.split(needle).length-1;
  if(count!==n)throw Error('Non-unique generator owner '+needle+': '+count+' hits');
}
const modes=[
 {name:'current',html:base},
 {name:'coverage-only',html:base.replace(conditional,conditionalOld)},
 {name:'locality-only',html:base.replace(cap,'if(leftM+d>2000)break;').replace(capRight,'if(rightM+d>2000)break;')},
 {name:'combined',html:base.replace(conditional,conditionalOld).replace(cap,'if(leftM+d>2000)break;').replace(capRight,'if(rightM+d>2000)break;')}
];
const queries=['Alaska','Arizona'];
const browser=await chromium.launch({headless:true});
const rows=[];
mkdirSync('artifacts/mantra92/generator-ab',{recursive:true});
for(const m of modes)for(const query of queries){
  const ctx=await browser.newContext({viewport:{width:1600,height:950}});
  const page=await ctx.newPage(),errs=[],http=[];
  page.on('pageerror',x=>errs.push(String(x)));
  page.on('response',r=>{if(r.status()>=400)http.push({code:r.status(),url:r.url()})});
  await page.route('**/*',async route=>{
    const req=route.request();
    if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE))
      return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:m.html});
    return route.continue();
  });
  let failure=null,start=Date.now();
  try{
    await page.goto(BASE+'?m92ab='+m.name+'-'+query+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:15000});
    await page.evaluate(q=>{const e=document.getElementById('searchInput');e.value=q;
      e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));
      document.getElementById('runBtn').click()},query);
    await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
      !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:90000,polling:200});
  }catch(e){failure=String(e)}
  const snap=await page.evaluate(()=>{
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const geom=window.EARTHLINE_REGIONAL_GEOMETRY_M84||null;
    const model=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
    const generation=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
    let src=null;
    try{const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
      const s=map?.getSource?.('el-live-swales-15970');
      src=s?._data||s?.serialize?.()?.data||null;
    }catch{}
    const fs=src?.features||[];
    const slopes=fs.map(f=>Number(f?.properties?.slope_pct)).filter(Number.isFinite);
    const stage=window.EARTHLINE_M92_STAGE_TIMINGS||null;
    return {profileId:model?.profileId||null,coreMs:perf?.phaseTotalsMs?.coreTotalMs||null,
      waterPaths:perf?.waterPaths||null,pub:pub?{generated:pub.generated,source:pub.sourceFeatures,overlay:pub.overlaySwaleLines}:null,
      swaleGeometry:geom?{accepted:geom.accepted,maxLengthM:geom.maxLengthM,p95LengthM:geom.p95LengthM}:null,
      maxSlope:slopes.length?Math.max(...slopes):null,sourceCount:fs.length,
      generation:generation?{generated:generation.generated,publishedFeatures:generation.publishedFeatures,
        candidatesBeforeJurisdiction:generation.candidatesBeforeJurisdiction,eligible:generation.eligible}:null,
      stage:stage?Object.fromEntries(Object.entries(stage).map(([k,v])=>[k,{calls:v.length,sumMs:v.reduce((a,s)=>a+s.ms,0)}])):null,
      error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
  }).catch(e=>({evaluationError:String(e)}));
  const row={mode:m.name,query,sha:'67de444b7048fc9a8ef5282dd3f4fb5961681779',elapsedMs:Date.now()-start,failure,snap,errs,http:http.slice(-8)};
  rows.push(row);
  console.log('M92_GENERATOR_AB '+JSON.stringify(row));
  await page.screenshot({path:'artifacts/mantra92/generator-ab/'+m.name+'-'+query.toLowerCase()+'.png'}).catch(()=>{});
  await ctx.close();
}
await browser.close();
writeFileSync('artifacts/mantra92/generator-ab/matrix.json',JSON.stringify(rows,null,2));
console.log('M92_GENERATOR_AB_SUMMARY '+JSON.stringify(rows.map(r=>({mode:r.mode,query:r.query,core:r.snap?.coreMs,swales:r.snap?.pub?.generated,
 maxLen:r.snap?.swaleGeometry?.maxLengthM,slope:r.snap?.maxSlope,errors:r.errs.length,failure:r.failure}))));
if(rows.some(r=>r.failure||r.snap?.error||r.snap?.evaluationError||r.errs.length))process.exitCode=1;
