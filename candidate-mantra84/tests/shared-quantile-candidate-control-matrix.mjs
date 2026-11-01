import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const CASES=['Texas','Texas','Texas','Colorado','New Mexico','New York','Vermont'];
const browser=await chromium.launch({headless:true});

const fnNeedle=`  async function makeContours(hy){\n    const min=percentile(hy.elev,0.02),max=percentile(hy.elev,0.98),range=Math.max(1,max-min),step=niceInterval(range,20),levels=[];\n    for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);`;
const fnRep=`  async function makeContours(hy,candidateQuantile16608=false){\n    const min=percentile(hy.elev,0.02),max=percentile(hy.elev,0.98),range=Math.max(1,max-min),step=niceInterval(range,20),levels=[];\n    if(candidateQuantile16608){\n      const seen16608=new Set();\n      for(let qi16608=1;qi16608<20;qi16608++){const v16608=percentile(hy.elev,qi16608/20),k16608=Math.round(v16608*10)/10;if(k16608>min&&k16608<max&&!seen16608.has(k16608)){seen16608.add(k16608);levels.push(k16608);}}\n    }else{for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);}\n    try{window.EARTHLINE_QUANTILE_CANDIDATE_16608={candidateMode:!!candidateQuantile16608,min,max,range,primaryStep:step,levels:levels.length,first:levels[0]??null,last:levels[levels.length-1]??null};}catch(_){}`;
const callNeedle=`    let swales=makeSwales(hy,contours,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;
const callRep=`    const swaleCandidateContours16608=focusMode?contours:await makeContours(hy,true);\n    let swales=makeSwales(hy,swaleCandidateContours16608,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;

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
    const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];if(!c.length)return null;const q=c[Math.floor((c.length-1)/2)];return Array.isArray(q)&&Number.isFinite(+q[0])&&Number.isFinite(+q[1])?[+q[0],+q[1]]:null;};
    const eastTexas=state==='Texas'?sw.reduce((n,f)=>{const m=mid(f);return n+(m&&m[0]>-96&&m[0]<-93.45&&m[1]>28.7&&m[1]<33.1?1:0);},0):null;
    return {diag:window.EARTHLINE_QUANTILE_CANDIDATE_16608||null,totalMs:Number(p?.totalMs||NaN),generation:g,visibleSwales:sw.length,eastTexas,outsideAfterClip:b?.outsideAfterClip||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()};
  },state);
  const out={runIndex:runIndex+1,state,fnCount,callCount,elapsedMs:Date.now()-started,timedOut,snap,errors:errors.slice(0,10)};
  console.log('EARTHLINE_SHARED_QUANTILE_MATRIX '+JSON.stringify(out));
  await page.close();
}
await browser.close();
