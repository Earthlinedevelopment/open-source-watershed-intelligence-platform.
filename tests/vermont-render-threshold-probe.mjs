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

await page.goto(BASE+'?vt_final_camera='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(let repeat=1;repeat<=5;repeat++){
 const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));
 const started=Date.now();
 await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 let timedOut=false;
 try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(300);
 const state=await page.evaluate(()=>({camera:window.EARTHLINE_FINAL_FRAME_CAMERA_AUDIT_16691||null,publication:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
 const row={repeat,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_VT_FINAL_CAMERA '+JSON.stringify(row));
}
console.log('EARTHLINE_VT_FINAL_CAMERA_SUMMARY '+JSON.stringify({patchMatches,rows}));
await browser.close();
const good=rows.filter(r=>!r.timedOut&&!r.state.lastError&&Number(r.state.publication?.generated||0)>0&&Number(r.state.display?.swaleLines||0)>0);
if(patchMatches!==1||good.length<5||good.some(r=>Number(r.state.display?.swaleLines||0)!==Number(r.state.publication?.generated||0)||!(Number(r.state.perf?.totalMs)<=15000)))process.exitCode=1;
