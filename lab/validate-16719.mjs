import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'Hawaii|Alaska').split('|').filter(Boolean);
const browser=await chromium.launch({headless:true});
const rows=[];

for(const stateName of STATES){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  await page.goto(URL+'?validate16719='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const started=Date.now();
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },stateName);
  let timedOut=false;
  try{
    await page.waitForFunction(expected=>{
      const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
      const name=String(pkg?.identity?.name||'').toLowerCase(),want=String(expected||'').toLowerCase();
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
      return name===want && (!!err || (!!pub?.runToken && /screening published\./i.test(status)));
    },stateName,{timeout:60000,polling:100});
  }catch(_){timedOut=true;}
  await page.waitForTimeout(500);
  const snap=await page.evaluate(()=>{
    const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    return {
      identity:pkg?.identity||null,
      extent:window.EARTHLINE_REGIONAL_ANALYSIS_EXTENT_16712||null,
      land:window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null,
      generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
      publication:pub&&{generated:pub.generated,runToken:pub.runToken},
      display:disp&&{swaleLines:disp.swaleLines},
      performance:perf,
      productsTiming:window.EARTHLINE_ORB_RESPONSIVENESS_16245||null,
      previewTiming:window.EARTHLINE_SWALE_PRIORITY_PREVIEW_16249||null,
      boundary:boundary&&{before:boundary.before,after:boundary.after,outsideAfterClip:boundary.outsideAfterClip},
      unsafe:flow?.unsafeSegments??null,
      error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
    };
  });
  rows.push({state:stateName,elapsedMs:Date.now()-started,timedOut,snap});
  await page.close();
}
await browser.close();

const failures=[];
for(const r of rows){
  if(r.timedOut)failures.push(r.state+': timeout');
  if(r.snap.error)failures.push(r.state+': '+JSON.stringify(r.snap.error));
  const g=Number(r.snap.publication?.generated||0),v=Number(r.snap.display?.swaleLines||0);
  if(!(g>0))failures.push(r.state+': zero published corridors');
  if(g!==v)failures.push(r.state+': visible/generated '+v+'/'+g);
  if(Number(r.snap.unsafe||0)!==0)failures.push(r.state+': unsafe '+r.snap.unsafe);
  if(Number(r.snap.boundary?.outsideAfterClip?.swales||0)!==0)failures.push(r.state+': outside swales '+r.snap.boundary?.outsideAfterClip?.swales);
  if(!(Number(r.snap.performance?.totalMs||Infinity)<=15000))failures.push(r.state+': core '+r.snap.performance?.totalMs);
}
const out={at:new Date().toISOString(),url:URL,rows,failures,pass:failures.length===0};
fs.writeFileSync(process.env.OUT||'lab/16719-validation.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out));
if(failures.length)process.exitCode=1;
