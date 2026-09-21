import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'Vermont').split('|').filter(Boolean);
const browser=await chromium.launch({headless:true});
const rows=[];
for(const stateName of STATES){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const started=Date.now(); let timedOut=false,error=null;
  try{
    await page.goto(URL+'?m4516777='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },stateName);
    await page.waitForFunction(expected=>{
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
      const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
      const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
      const spatial=window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null;
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      const identityMatches=String(pkg?.identity?.name||'').toLowerCase()===String(expected).toLowerCase();
      const generated=Number(pub?.generated??0),visible=Number(disp?.swaleLines??0);
      return identityMatches && (!!err || (spatial?.build==='EARTHLINE 16777'&&generated>0&&visible===generated));
    },stateName,{timeout:65000,polling:100});
    error=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
  }catch(e){timedOut=true;error=error||String(e&&e.message||e);}
  await page.waitForTimeout(250);
  const snap=await page.evaluate(()=>{
    const spatial=window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||{};
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||{};
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{};
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||{};
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||{};
    const order=window.EARTHLINE_REGIONAL_SCORE_ORDER_16717||{};
    const land=window.EARTHLINE_LAND_VALIDITY_16584||{};
    const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||{};
    return {
      build:spatial.build||null,reserved:Number(spatial.reserved||0),capacity:Number(spatial.capacity||0),
      generated:Number(pub.generated||0),visible:Number(disp.swaleLines||0),totalMs:Number(perf.totalMs??NaN),
      unsafe:Number(flow.unsafeSegments??0),outside:boundary.outsideAfterClip||null,orderMonotonic:order.monotonic??null,
      waterReady:Array.isArray(land.waterParts),identity:String(pkg?.identity?.name||'')
    };
  }).catch(()=>({}));
  const failures=[];
  if(timedOut)failures.push('timeout');
  if(error)failures.push('error '+JSON.stringify(error));
  if(snap.build!=='EARTHLINE 16777')failures.push('build '+snap.build);
  if(!(snap.generated>0))failures.push('zero swales');
  if(snap.generated!==snap.visible)failures.push('visible/generated '+snap.visible+'/'+snap.generated);
  if(!(snap.totalMs<=15000))failures.push('core '+snap.totalMs);
  if(snap.unsafe!==0)failures.push('unsafe '+snap.unsafe);
  if(!snap.waterReady)failures.push('water sidecar not ready');
  if(snap.outside&&Object.values(snap.outside).some(v=>Number(v||0)!==0))failures.push('outside '+JSON.stringify(snap.outside));
  if(snap.orderMonotonic===false)failures.push('rank order');
  if(String(snap.identity||'').toLowerCase()!==stateName.toLowerCase())failures.push('identity '+snap.identity);
  rows.push({state:stateName,elapsedMs:Date.now()-started,timedOut,error,snap,failures,pass:failures.length===0});
  await page.close();
}
await browser.close();
const out={at:new Date().toISOString(),url:URL,rows,failed:rows.filter(r=>!r.pass).map(r=>({state:r.state,failures:r.failures})),pass:rows.every(r=>r.pass)};
fs.writeFileSync(process.env.OUT||'machine16777.json',JSON.stringify(out,null,2));
console.log(JSON.stringify({count:rows.length,failed:out.failed,pass:out.pass,rows:rows.map(r=>({state:r.state,pass:r.pass,ms:r.snap.totalMs,gen:r.snap.generated,vis:r.snap.visible,unsafe:r.snap.unsafe}))}));
if(!out.pass)process.exitCode=1;
