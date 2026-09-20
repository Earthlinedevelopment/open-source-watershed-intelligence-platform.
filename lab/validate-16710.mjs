import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'Texas|California|New York|Massachusetts').split('|').filter(Boolean);
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.goto(URL+'?validate16710='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(const stateName of STATES){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||'')),started=Date.now();
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    window.EARTHLINE_SCALE_REFINEMENT_TRIGGER_16705=null;
    window.EARTHLINE_SCALE_REFINED_INPUT_16702=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },stateName);
  let timedOut=false;
  try{
    await page.waitForFunction(prev=>{
      const token=String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||''),err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
      return !!err||((!prev||token!==prev)&&!!token&&/screening published\./i.test(status));
    },prior,{timeout:50000,polling:100});
  }catch(_){timedOut=true;}
  await page.waitForTimeout(400);
  const snap=await page.evaluate(q=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[],mid=f=>{const c=f?.geometry?.coordinates||[];return c.length?c[Math.floor((c.length-1)/2)]:null;},pts=sw.map(mid).filter(Array.isArray),reg=fn=>pts.filter(p=>fn(+p[0],+p[1])).length;
    let regions=null;
    if(/texas/i.test(q))regions={panhandle:reg((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperGulf:reg((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerGulf:reg((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),east:reg((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)};
    const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    return {trigger:window.EARTHLINE_SCALE_REFINEMENT_TRIGGER_16705||null,input:window.EARTHLINE_SCALE_REFINED_INPUT_16702||null,swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,totalMs:p?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,regions,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
  },stateName);
  rows.push({state:stateName,elapsedMs:Date.now()-started,timedOut,snap});
}
await browser.close();

const failures=[];
for(const r of rows){
  if(r.timedOut)failures.push(r.state+': timeout');
  if(r.snap.lastError)failures.push(r.state+': '+String(r.snap.lastError));
  if(!(Number(r.snap.totalMs)<=15000))failures.push(r.state+': core '+r.snap.totalMs);
  if(Number(r.snap.unsafe||0)!==0)failures.push(r.state+': unsafe '+r.snap.unsafe);
  if(Number(r.snap.outside?.swales||0)!==0)failures.push(r.state+': outside '+r.snap.outside?.swales);
  if(Number(r.snap.visible)!==Number(r.snap.published))failures.push(r.state+': visible/published '+r.snap.visible+'/'+r.snap.published);
}
const tx=rows.find(r=>r.state==='Texas');
if(!tx?.snap?.trigger?.triggered)failures.push('Texas: refinement did not trigger');
if(!(Number(tx?.snap?.input?.input||0)>0))failures.push('Texas: no refined input');
if(!(Number(tx?.snap?.regions?.panhandle||0)>0))failures.push('Texas: Panhandle lost');
if(!(Number(tx?.snap?.regions?.east||0)>0))failures.push('Texas: east lost');
if(!(Number(tx?.snap?.regions?.upperGulf||0)+Number(tx?.snap?.regions?.lowerGulf||0)>=8))failures.push('Texas: Gulf still sparse');
const ca=rows.find(r=>r.state==='California');
if(ca?.snap?.trigger?.triggered)failures.push('California: refinement should not trigger at this grid scale');

const out={at:new Date().toISOString(),url:URL,rows,failures,pass:failures.length===0};
fs.writeFileSync(process.env.OUT||'lab/16710-validation.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out));
if(failures.length)process.exitCode=1;
