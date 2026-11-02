import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';

// Reproducible comparison of the ACTUAL historical builds, each hosted under the
// same Earthline HTTPS origin in a Playwright route. Never modify public production.
// Historical script assets are served from the same immutable commit as their page.
const BASE='https://earthlinedevelopment.org/';
const shaByLabel=JSON.parse(readFileSync('artifacts/mantra92/bisect/manifest.json','utf8'));
const tests=['Alaska','Arizona'];
const browser=await chromium.launch({headless:true});
const results=[];
mkdirSync('artifacts/mantra92/bisect/results',{recursive:true});
for(const [label,sha] of Object.entries(shaByLabel)){
  const folder='artifacts/mantra92/bisect/'+label+'/';
  const html=readFileSync(folder+'index.html','utf8');
  for(const query of tests){
    const ctx=await browser.newContext({viewport:{width:1600,height:950}});
    const page=await ctx.newPage();
    const errors=[],httpErrors=[];
    page.on('pageerror',e=>errors.push(String(e)));
    page.on('response',r=>{if(r.status()>=400)httpErrors.push({status:r.status(),url:r.url()})});
    await page.route('**/*',async route=>{
      const req=route.request(),url=new URL(req.url());
      if(url.origin===new URL(BASE).origin){
        if(req.isNavigationRequest()&&req.resourceType()==='document')
          return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
        for(const a of ['earthline-launch-16872.js','earthline-language-hotfix-16890.js','earthline-elder-restored-17097.js','earthline-elder-worker-17129.js']){
          if(url.pathname.endsWith('/'+a)){
            try{return route.fulfill({status:200,contentType:'application/javascript',
              body:readFileSync(folder+a,'utf8')})}catch{}
          }
        }
      }
      return route.continue();
    });
    let error=null,start=Date.now(),clickAt=null;
    try{
      await page.goto(BASE+'?m92bisect='+label+'-'+query+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
      await page.waitForSelector('#searchInput',{timeout:15000});
      clickAt=Date.now();
      await page.evaluate(q=>{
        const el=document.getElementById('searchInput');
        el.value=q;el.dispatchEvent(new Event('input',{bubbles:true}));
        el.dispatchEvent(new Event('change',{bubbles:true}));
        document.getElementById('runBtn').click();
      },query);
      await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
        !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:90000,polling:200});
    }catch(e){error=String(e)}
    const snap=await page.evaluate(()=>{
      const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
      const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
      const grid=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null;
      const cam=window.EARTHLINE_REGIONAL_CAMERA_AUDIT_16147||null;
      const first=window.EARTHLINE_REGIONAL_ANALYSIS_EXTENT_16712||null;
      const stage=window.EARTHLINE_M92_STAGE_TIMINGS||null;
      return {
        profileId:pkg?.profileId||null,center:pkg?.center||null,coreMs:perf?.phaseTotalsMs?.coreTotalMs??null,
        phases:perf?.phaseTotalsMs||null,waterPaths:perf?.waterPaths??null,swales:perf?.swales??null,
        published:pub?.generated??null,sourceFeatures:pub?.sourceFeatures??null,overlay:pub?.overlaySwaleLines??null,
        invalidCells:grid?.rasterizedInvalidWaterCellCount??null,validCells:grid?.validLandCellCount??null,
        boundaryPolygons:pkg?.boundary?.prepared?.polygons?.length??null,
        extent:first?.bbox??null,cameraCoverage:cam?.sampledAreaCoveredByCamera??null,
        tier:document.documentElement.dataset.earthlineAnalysisTier||null,
        stage:stage?Object.fromEntries(Object.entries(stage).map(([k,v])=>[k,{calls:v.length,sumMs:v.reduce((a,s)=>a+s.ms,0)}])):null,
        fatal:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
      };
    }).catch(e=>({evaluationError:String(e)}));
    const row={label,sha,query,elapsedMs:Date.now()-start,runWallMs:clickAt?Date.now()-clickAt:null,
      error,snap,pageErrors:errors.slice(-8),badHttp:httpErrors.slice(-8)};
    results.push(row);
    console.log('M92_BISECT '+JSON.stringify(row));
    writeFileSync('artifacts/mantra92/bisect/results/'+label+'-'+query.toLowerCase()+'.json',JSON.stringify(row,null,2));
    await page.screenshot({path:'artifacts/mantra92/bisect/results/'+label+'-'+query.toLowerCase()+'.png'}).catch(()=>{});
    await ctx.close();
  }
}
await browser.close();
writeFileSync('artifacts/mantra92/bisect/results/matrix.json',JSON.stringify(results,null,2));
const summary=results.map(r=>({label:r.label,sha:r.sha.slice(0,10),query:r.query,coreMs:r.snap?.coreMs,
  water:r.snap?.waterPaths,swales:r.snap?.published,covered:r.snap?.cameraCoverage,errors:r.pageErrors.length,
  failed:!!(r.error||r.snap?.fatal||r.snap?.evaluationError)}));
console.log('M92_BISECT_SUMMARY '+JSON.stringify(summary));
if(results.some(r=>r.error||r.snap?.fatal||r.snap?.evaluationError||r.pageErrors.length))process.exitCode=1;
