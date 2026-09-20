import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'').split('|').map(s=>s.trim()).filter(Boolean);
const OUT=process.env.OUT||'allstates.json';
if(!STATES.length) throw new Error('STATES is required');

const browser=await chromium.launch({headless:true});
const rows=[];

for(const stateName of STATES){
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  const started=Date.now();
  let timedOut=false;
  try{
    await page.goto(URL+'?all50='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      window.EARTHLINE_REGIONAL_SCORE_ORDER_16717=null;
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },stateName);
    await page.waitForFunction(expected=>{
      const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
      const identity=String(pkg?.identity?.name||'').toLowerCase();
      const want=String(expected).toLowerCase();
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
      const token=String(pub?.runToken||'').toLowerCase();
      const identityOk=identity===want || (want==='vermont'&&token.includes('vermont'));
      return identityOk && (!!err || (!!pub?.runToken && /screening published\./i.test(status)));
    },stateName,{timeout:60000,polling:100});
  }catch(_){timedOut=true;}
  await page.waitForTimeout(350);
  const snap=await page.evaluate(()=>{
    const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const order=window.EARTHLINE_REGIONAL_SCORE_ORDER_16717||null;
    const visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const sw=Array.isArray(visual?.swales?.features)?visual.swales.features:[];
    const scores=sw.map(f=>Number(f?.properties?.score)).filter(Number.isFinite);
    const scoreMonotonic=scores.every((v,i)=>i===0||scores[i-1]>=v);
    return {
      identity:pkg?.identity||null,
      extent:pkg?.regionalExtent||null,
      generated:Number(pub?.generated??0),
      visible:Number(disp?.swaleLines??0),
      totalMs:Number(perf?.totalMs??NaN),
      unsafe:Number(flow?.unsafeSegments??0),
      outside:boundary?.outsideAfterClip||null,
      orderMonotonic:order?.monotonic??scoreMonotonic,
      swaleCount:sw.length,
      error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
    };
  }).catch(e=>({snapshotError:String(e)}));
  const failures=[];
  if(timedOut)failures.push('timeout');
  if(snap.snapshotError)failures.push('snapshot '+snap.snapshotError);
  if(snap.error)failures.push('error '+JSON.stringify(snap.error));
  if(stateName!=='Vermont'&&String(snap.identity?.name||'').toLowerCase()!==stateName.toLowerCase())failures.push('identity '+String(snap.identity?.name||'none'));
  if(!(Number(snap.generated)>0))failures.push('zero generated');
  if(Number(snap.visible)!==Number(snap.generated))failures.push('visible/generated '+snap.visible+'/'+snap.generated);
  if(!(Number(snap.totalMs)<=15000))failures.push('core '+snap.totalMs);
  if(Number(snap.unsafe||0)!==0)failures.push('unsafe '+snap.unsafe);
  if(snap.outside && Object.values(snap.outside).some(v=>Number(v||0)!==0))failures.push('outside '+JSON.stringify(snap.outside));
  if(snap.orderMonotonic!==true)failures.push('rank not score-monotonic');
  rows.push({state:stateName,elapsedMs:Date.now()-started,timedOut,snap,failures,pass:failures.length===0});
  await page.close();
}
await browser.close();

const failed=rows.filter(r=>!r.pass).map(r=>({state:r.state,failures:r.failures}));
const out={at:new Date().toISOString(),url:URL,states:STATES,rows,failed,pass:failed.length===0};
fs.writeFileSync(OUT,JSON.stringify(out,null,2));
console.log(JSON.stringify(out));
if(failed.length)process.exitCode=1;
