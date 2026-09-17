import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const MODES=['split100','quantile20'];
const browser=await chromium.launch({headless:true});

const fnNeedle=`  async function makeContours(hy){\n    const min=percentile(hy.elev,0.02),max=percentile(hy.elev,0.98),range=Math.max(1,max-min),step=niceInterval(range,20),levels=[];\n    for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);`;
const callNeedle=`    let swales=makeSwales(hy,contours,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;

function replacements(mode){
  if(mode==='split100')return {
    fn:`  async function makeContours(hy,target16607=20){\n    const min=percentile(hy.elev,0.02),max=percentile(hy.elev,0.98),range=Math.max(1,max-min),step=niceInterval(range,target16607),levels=[];\n    for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);\n    try{window.EARTHLINE_CANDIDATE_CONTOUR_16607={mode:'split100',target:target16607,min,max,range,step,levels:levels.length};}catch(_){}`,
    call:`    const swaleCandidateContours16607=focusMode?contours:await makeContours(hy,40);\n    let swales=makeSwales(hy,swaleCandidateContours16607,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`
  };
  return {
    fn:`  async function makeContours(hy,candidateQuantile16607=false){\n    const min=percentile(hy.elev,0.02),max=percentile(hy.elev,0.98),range=Math.max(1,max-min),step=niceInterval(range,20),levels=[];\n    if(candidateQuantile16607){\n      const seen16607=new Set();\n      for(let qi16607=1;qi16607<20;qi16607++){const v16607=percentile(hy.elev,qi16607/20),k16607=Math.round(v16607*10)/10;if(k16607>min&&k16607<max&&!seen16607.has(k16607)){seen16607.add(k16607);levels.push(k16607);}}\n    }else{for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);}\n    try{window.EARTHLINE_CANDIDATE_CONTOUR_16607={mode:candidateQuantile16607?'quantile20':'primary',min,max,range,step,levels:levels.length,first:levels[0]??null,last:levels[levels.length-1]??null};}catch(_){}`,
    call:`    const swaleCandidateContours16607=focusMode?contours:await makeContours(hy,true);\n    let swales=makeSwales(hy,swaleCandidateContours16607,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`
  };
}

for(const mode of MODES){
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e))); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  let fnCount=0,callCount=0;
  const rep=replacements(mode);
  await page.route('**/*',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch(),text=await resp.text();
    fnCount=text.split(fnNeedle).length-1; callCount=text.split(callNeedle).length-1;
    let body=text.split(fnNeedle).join(rep.fn); body=body.split(callNeedle).join(rep.call);
    return route.fulfill({response:resp,body});
  });
  const started=Date.now();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published\./i.test(s)&&!!window.EARTHLINE_SWALE_GENERATION_AUDIT_16167);},{timeout:35000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(300);
  const snap=await page.evaluate(()=>{
    const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];if(!c.length)return null;const q=c[Math.floor((c.length-1)/2)];return Array.isArray(q)&&Number.isFinite(+q[0])&&Number.isFinite(+q[1])?[+q[0],+q[1]]:null;};
    const eastTexas=sw.reduce((n,f)=>{const m=mid(f);return n+(m&&m[0]>-96&&m[0]<-93.45&&m[1]>28.7&&m[1]<33.1?1:0);},0);
    let eastmost=null;for(const f of sw){const m=mid(f);if(m&&(!eastmost||m[0]>eastmost[0]))eastmost=m;}
    return {diag:window.EARTHLINE_CANDIDATE_CONTOUR_16607||null,totalMs:Number(p?.totalMs||NaN),generation:g,visibleSwales:sw.length,eastTexas,eastmost,outsideAfterClip:b?.outsideAfterClip||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()};
  });
  console.log('EARTHLINE_TX_CANDIDATE_CONTOUR_STRATEGY '+JSON.stringify({mode,fnCount,callCount,elapsedMs:Date.now()-started,timedOut,snap,errors:errors.slice(0,10)}));
  await page.close();
}
await browser.close();
