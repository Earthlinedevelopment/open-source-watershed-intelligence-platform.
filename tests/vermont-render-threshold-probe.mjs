import { chromium } from 'playwright';
const BASE='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
let patchMatches=0;

await page.route('**/*',async route=>{
 const req=route.request();
 if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
  const response=await route.fetch();let body=await response.text();
  const needle=`    if(cameraReady16334!==true){
      throw new Error('regional basemap/camera did not settle completely; partial tile display was not published');
    }

    if(!focusMode&&hy&&hy.validityMask16584){`;
  const repl=`    if(cameraReady16334!==true){
      throw new Error('regional basemap/camera did not settle completely; partial tile display was not published');
    }
    try{
      const cb16691=m&&m.getBounds&&m.getBounds();
      const targetSpan16691=Math.max(Math.abs(b[2]-b[0]),Math.abs(b[3]-b[1]));
      const currentSpan16691=cb16691?Math.max(Math.abs(cb16691.getEast()-cb16691.getWest()),Math.abs(cb16691.getNorth()-cb16691.getSouth())):Infinity;
      const ratio16691=targetSpan16691>0?currentSpan16691/targetSpan16691:Infinity;
      const coverage16691=cameraCoverage(m,b);
      let reasserted16691=false;
      if(!Number.isFinite(ratio16691)||ratio16691>4||coverage16691<.98){
        reasserted16691=true;
        const repaired16691=await settleRegionalCamera(m,b,runToken);
        if(repaired16691!==true)throw new Error('regional final-frame camera reassert failed');
      }
      window.EARTHLINE_FINAL_FRAME_CAMERA_AUDIT_16691={runToken,targetSpan:targetSpan16691,currentSpanBefore:currentSpan16691,ratioBefore:ratio16691,coverageBefore:coverage16691,reasserted:reasserted16691,coverageAfter:cameraCoverage(m,b),at:new Date().toISOString()};
    }catch(e16691){if(e16691&&/camera reassert failed/.test(String(e16691.message||e16691)))throw e16691;}
    if(!focusMode&&hy&&hy.validityMask16584){`;
  patchMatches=body.split(needle).length-1;
  if(patchMatches!==1)throw new Error('camera anchor expected once, found '+patchMatches);
  body=body.replace(needle,repl);
  await route.fulfill({response,body});return;
 }
 await route.continue();
});

await page.goto(BASE+'?shared_final_camera='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const states=['Vermont','Massachusetts','Texas','California','Maryland','New York'];
const rows=[];
for(const stateName of states){
 for(let repeat=1;repeat<=2;repeat++){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));
  const started=Date.now();
  await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},stateName);
  let timedOut=false;
  try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(250);
  const state=await page.evaluate(()=>{const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;return {camera:window.EARTHLINE_FINAL_FRAME_CAMERA_AUDIT_16691||null,publication:pub,display:disp,generation:gen,perf:p,outside:b?.outsideAfterClip??null,unsafe:flow?.unsafeSegments??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};});
  const published=Number(state.publication?.generated||0),visible=Number(state.display?.swaleLines||0);
  const row={state:stateName,repeat,elapsedMs:Date.now()-started,timedOut,published,visible,visibleRatio:published?Number((visible/published).toFixed(3)):null,detail:state};rows.push(row);console.log('EARTHLINE_SHARED_FINAL_CAMERA '+JSON.stringify(row));
 }
}
console.log('EARTHLINE_SHARED_FINAL_CAMERA_SUMMARY '+JSON.stringify({patchMatches,rows}));
await browser.close();
const bad=rows.some(r=>r.timedOut||r.detail.lastError||!(Number(r.detail.perf?.totalMs)<=15000)||Number(r.detail.outside?.swales||0)!==0||Number(r.detail.unsafe||0)!==0||r.published<=0||r.visible<=0||(r.visible/r.published)<.90);
if(patchMatches!==1||bad)process.exitCode=1;
