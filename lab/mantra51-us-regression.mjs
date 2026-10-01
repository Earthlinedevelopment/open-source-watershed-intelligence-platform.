import { chromium } from 'playwright';
const BASE=process.env.EARTHLINE_CANDIDATE||'http://127.0.0.1:8787/';
const STATES=['Arizona','New Mexico','Colorado','Texas','California','Vermont','New York','Maryland','Alaska'];
const browser=await chromium.launch({headless:true});
const rows=[];
for(const query of STATES){
  const context=await browser.newContext({viewport:{width:1500,height:860}});
  const page=await context.newPage();
  const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
  let harnessError=null,timedOut=false;
  try{
    await page.goto(BASE+'?m51-us='+encodeURIComponent(query)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;
        const d=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;
        return !!e||String(d?.query||'').trim().toLowerCase()===String(q).trim().toLowerCase();
      },query,{timeout:95000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(300);
  }catch(e){harnessError=String(e?.message||e);}
  const snap=await page.evaluate(({query,harnessError,timedOut,pageErrors})=>{
    const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
    const run=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const visible=Number(disp?.swaleLines??pub?.visible??pub?.overlaySwaleLines??pub?.generated??0);
    return {
      query,harnessError,timedOut,pageErrors,error:err&&String(err.error||err.message||err),
      generated:Number(pub?.generated||0),visible,
      unsafe:Number(flow?.unsafeSegments??pub?.unsafeDisplayedSegments??0),
      outside:Number(boundary?.outsideAfterClip?.swales??pub?.outsideJurisdiction??0),
      waterPaths:Number(run?.derived?.waterPaths||0),totalMs:Number(perf?.totalMs||0),
      runBounds:run?.bounds||null
    };
  },{query,harnessError,timedOut,pageErrors});
  snap.pass=!snap.harnessError&&!snap.timedOut&&!snap.error&&!snap.pageErrors.length&&snap.generated>0&&snap.visible===snap.generated&&snap.unsafe===0&&snap.outside===0&&snap.waterPaths>0&&snap.totalMs>0&&snap.totalMs<=15000;
  rows.push(snap); console.log(JSON.stringify(snap));
  await context.close();
}
await browser.close();
const failed=rows.filter(r=>!r.pass);
console.log(JSON.stringify({summary:{passes:rows.filter(r=>r.pass).map(r=>r.query),failed:failed.map(r=>r.query),count:rows.length}}));
if(failed.length)process.exit(1);
