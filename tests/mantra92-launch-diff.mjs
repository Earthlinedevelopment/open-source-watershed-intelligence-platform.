import {chromium} from 'playwright';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const oldRoot='artifacts/mantra92/oct05/';
const oldHtml=readFileSync(oldRoot+'index.html','utf8');
const oldLaunch=readFileSync(oldRoot+'earthline-launch-16872.js','utf8');
const oldLanguage=readFileSync(oldRoot+'earthline-language-hotfix-16890.js','utf8');
const candidateHtml=readFileSync('index.html','utf8');
const cases=[{mode:'launch-oct05',html:oldHtml},{mode:'production-nov02',html:null},{mode:'candidate-mantra91',html:candidateHtml}];
const queries=['Alaska','Arizona'];
mkdirSync('artifacts/mantra92/results',{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
for(const {mode,html} of cases){
 for(const query of queries){
  const context=await browser.newContext({viewport:{width:1600,height:950}});
  const page=await context.newPage(),errors=[],bad=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)bad.push({code:r.status(),url:r.url()})});
  if(html)await page.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(req.isNavigationRequest()&&req.resourceType()==='document'&&url.origin===new URL(BASE).origin)
    return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
   if(mode==='launch-oct05'&&url.origin===new URL(BASE).origin){
    if(url.pathname.endsWith('/earthline-launch-16872.js'))
     return route.fulfill({status:200,contentType:'application/javascript',body:oldLaunch});
    if(url.pathname.endsWith('/earthline-language-hotfix-16890.js'))
     return route.fulfill({status:200,contentType:'application/javascript',body:oldLanguage});
   }
   return route.continue();
  });
  let failure=null,loadMs=null,runMs=null,init=Date.now(),clicked;
  try{
   await page.goto(BASE+'?m92='+mode+'-'+query+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForSelector('#searchInput',{timeout:15000});
   loadMs=Date.now()-init;
   clicked=Date.now();
   await page.evaluate(q=>{
    const el=document.getElementById('searchInput');
    el.value=q;
    el.dispatchEvent(new Event('input',{bubbles:true}));
    el.dispatchEvent(new Event('change',{bubbles:true}));
    document.getElementById('runBtn').click();
   },query);
   await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
     !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:90000,polling:200});
   runMs=Date.now()-clicked;
  }catch(e){failure=String(e)}
  const snap=await page.evaluate(()=>{
   const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
   const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
   const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
   const grid=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null;
   const sel=document.getElementById('earthlineLanguage16488');
   return {
    profileId:pkg?.profileId??null,profileCenter:pkg?.center??null,
    coreMs:perf?.phaseTotalsMs?.coreTotalMs??null,
    phases:perf?.phaseTotalsMs??null,waterPaths:perf?.waterPaths??null,swales:perf?.swales??null,
    pub:pub?{generated:pub.generated,sourceFeatures:pub.sourceFeatures,overlaySwaleLines:pub.overlaySwaleLines}:null,
    land:grid?{valid:grid.validLandCellCount,invalid:grid.rasterizedInvalidWaterCellCount}:null,
    tier:document.documentElement.dataset.earthlineAnalysisTier,
    languageOwner16890:!!window.earthlineLanguageOwner16890,
    languages:sel?Array.from(sel.options).map(o=>({value:o.value,label:o.textContent})):null,
    elderModule:!!window.EARTHLINE_ELDER_TREES_V1_17097,
    err:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    status:document.getElementById('earthlineVermontStatus16147')?.textContent||''
   };
  }).catch(e=>({evaluationError:String(e)}));
  const item={mode,query,loadMs,runMs,elapsedMs:Date.now()-init,failure,snap,errors:errors.slice(-10),bad:bad.slice(-10)};
  results.push(item);
  console.log('M92_COMPARISON '+JSON.stringify(item));
  await page.screenshot({path:'artifacts/mantra92/results/'+mode+'-'+query.toLowerCase()+'.png'}).catch(()=>{});
  await context.close();
 }
}
writeFileSync('artifacts/mantra92/results/compare.json',JSON.stringify(results,null,2));
const findings={};
for(const query of queries){
 const r=Object.fromEntries(results.filter(x=>x.query===query).map(x=>[x.mode,x]));
 findings[query]={oct05Ms:r['launch-oct05']?.snap?.coreMs,productionMs:r['production-nov02']?.snap?.coreMs,
  candidateMs:r['candidate-mantra91']?.snap?.coreMs,
  oct05Water:r['launch-oct05']?.snap?.waterPaths,productionWater:r['production-nov02']?.snap?.waterPaths,
  oct05Swales:r['launch-oct05']?.snap?.pub?.generated,productionSwales:r['production-nov02']?.snap?.pub?.generated,
  launchFailure:r['launch-oct05']?.failure,liveFailure:r['production-nov02']?.failure};
}
console.log('M92_SUMMARY '+JSON.stringify(findings));
await browser.close();
if(results.some(x=>x.failure||x.snap?.evaluationError))process.exitCode=1;
