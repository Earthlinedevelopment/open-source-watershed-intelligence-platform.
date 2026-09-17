import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const CASES=['Texas','Texas','Texas','Colorado','Colorado','New Mexico','New York','Vermont'];
const browser=await chromium.launch({headless:true});
const results=[];

const fnNeedle=`  async function makeContours(hy){\n    const min=percentile(hy.elev,0.02),max=percentile(hy.elev,0.98),range=Math.max(1,max-min),step=niceInterval(range,20),levels=[];\n    for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);`;
const fnRep=`  async function makeContours(hy,candidateQuantile16609=false){\n    const min=percentile(hy.elev,0.02),max=percentile(hy.elev,0.98),range=Math.max(1,max-min),step=niceInterval(range,20),levels=[];\n    if(candidateQuantile16609){\n      const seen16609=new Set();\n      for(let qi16609=1;qi16609<20;qi16609++){const v16609=percentile(hy.elev,qi16609/20),k16609=Math.round(v16609*10)/10;if(k16609>min&&k16609<max&&!seen16609.has(k16609)){seen16609.add(k16609);levels.push(k16609);}}\n    }else{for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);}`;
const callNeedle=`    let swales=makeSwales(hy,contours,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;
const callRep=`    const min16609=percentile(hy.elev,0.02),max16609=percentile(hy.elev,0.98),step16609=niceInterval(Math.max(1,max16609-min16609),20);\n    const useSupplemental16609=!focusMode&&step16609>=200;\n    const swaleCandidateContours16609=useSupplemental16609?await makeContours(hy,true):contours;\n    try{window.EARTHLINE_COARSE_QUANTILE_16609={primaryStep:step16609,useSupplemental:useSupplemental16609};}catch(_){}\n    let swales=makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;

for(let runIndex=0;runIndex<CASES.length;runIndex++){
  const state=CASES[runIndex];
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  let fnCount=0,callCount=0;
  await page.route('**/*',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch(),text=await resp.text();
    fnCount=text.split(fnNeedle).length-1;callCount=text.split(callNeedle).length-1;
    let body=text.split(fnNeedle).join(fnRep);body=body.split(callNeedle).join(callRep);
    return route.fulfill({response:resp,body});
  });
  const started=Date.now();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(state=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=state;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},state);
  let timedOut=false;try{await page.waitForFunction(state=>{const m=typeof M!=='undefined'?M:null,ident=String(m?.loc?.name||'')+' '+String(m?.loc?.fullName||'');const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(new RegExp(state.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(ident)&&(/screening published\./i.test(s)||/ANALYSIS FAILED/i.test(s))&&!!window.EARTHLINE_SWALE_GENERATION_AUDIT_16167);},state,{timeout:35000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(300);
  const snap=await page.evaluate(state=>{
    const d=window.EARTHLINE_COARSE_QUANTILE_16609||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];if(!c.length)return null;const q=c[Math.floor((c.length-1)/2)];return Array.isArray(q)&&Number.isFinite(+q[0])&&Number.isFinite(+q[1])?[+q[0],+q[1]]:null;};
    const eastTexas=state==='Texas'?sw.reduce((n,f)=>{const m=mid(f);return n+(m&&m[0]>-96&&m[0]<-93.45&&m[1]>28.7&&m[1]<33.1?1:0);},0):null;
    return {diag:d,totalMs:Number(p?.totalMs||NaN),generation:g,visibleSwales:sw.length,eastTexas,outsideAfterClip:b?.outsideAfterClip||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()};
  },state);
  const out={runIndex:runIndex+1,state,fnCount,callCount,elapsedMs:Date.now()-started,timedOut,snap,errors:errors.slice(0,10)};
  results.push(out);
  console.log('EARTHLINE_COARSE_QUANTILE_GATE '+JSON.stringify(out));
  await page.close();
}
await browser.close();

const failures=[];
for(const r of results){
  if(r.fnCount!==1||r.callCount!==1)failures.push(`${r.state} patch-count ${r.fnCount}/${r.callCount}`);
  if(r.timedOut)failures.push(`${r.state} timed out`);
  const d=r.snap?.diag||{};
  if(r.state==='Texas'){
    if(d.primaryStep<200||d.useSupplemental!==true)failures.push('Texas supplemental rule did not engage');
    if(r.snap?.lastError)failures.push(`Texas error ${r.snap.lastError?.error||r.snap.lastError}`);
    if((r.snap?.generation?.publishedFeatures||0)<55)failures.push(`Texas published ${r.snap?.generation?.publishedFeatures||0}`);
    if((r.snap?.visibleSwales||0)<55)failures.push(`Texas visible ${r.snap?.visibleSwales||0}`);
    if((r.snap?.eastTexas||0)<5)failures.push(`Texas east coverage ${r.snap?.eastTexas||0}`);
    if(Number.isFinite(r.snap?.totalMs)&&r.snap.totalMs>15000)failures.push(`Texas core ${r.snap.totalMs}ms`);
    if((r.snap?.outsideAfterClip?.swales||0)!==0)failures.push(`Texas outside swales ${r.snap?.outsideAfterClip?.swales}`);
  }else if(r.state==='Colorado'){
    if(d.primaryStep<200||d.useSupplemental!==true)failures.push('Colorado supplemental rule did not engage');
    if(r.snap?.lastError)failures.push(`Colorado error ${r.snap.lastError?.error||r.snap.lastError}`);
    if((r.snap?.visibleSwales||0)<70)failures.push(`Colorado visible ${r.snap?.visibleSwales||0}`);
    if(Number.isFinite(r.snap?.totalMs)&&r.snap.totalMs>15000)failures.push(`Colorado core ${r.snap.totalMs}ms`);
    if((r.snap?.outsideAfterClip?.swales||0)!==0)failures.push(`Colorado outside swales ${r.snap?.outsideAfterClip?.swales}`);
  }else{
    if(d.primaryStep>=200||d.useSupplemental!==false)failures.push(`${r.state} should remain on primary contour path`);
  }
}
console.log('EARTHLINE_COARSE_QUANTILE_GATE_SUMMARY '+JSON.stringify({passed:failures.length===0,failures,results:results.map(r=>({state:r.state,diag:r.snap?.diag,totalMs:r.snap?.totalMs,published:r.snap?.generation?.publishedFeatures,visible:r.snap?.visibleSwales,eastTexas:r.snap?.eastTexas,lastError:r.snap?.lastError}))}));
if(failures.length)process.exitCode=1;
