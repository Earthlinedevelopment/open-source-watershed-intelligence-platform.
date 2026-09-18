import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const rows=[],patches={};
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected 1 match, found '+n);body=body.replace(needle,replacement);};
  apply('terrainStagger',
    '        stagger=setTimeout(startAlternate,250);',
    '        stagger=setTimeout(startAlternate,1200);');
  apply('cameraFinalFrameGuard',
    '    const cameraReady16334=await cameraSettle16310;',
    `    let cameraReady16334=await cameraSettle16310;
    try{
      const cb16643=m&&m.getBounds&&m.getBounds(),targetSpan16643=Math.max(Math.abs(b[2]-b[0]),Math.abs(b[3]-b[1]));
      const cameraSpan16643=cb16643?Math.max(Math.abs(cb16643.getEast()-cb16643.getWest()),Math.abs(cb16643.getNorth()-cb16643.getSouth())):Infinity;
      const frameRatio16643=targetSpan16643>0&&Number.isFinite(cameraSpan16643)?cameraSpan16643/targetSpan16643:Infinity;
      const reassert16643=frameRatio16643>4;
      window.EARTHLINE_CAMERA_FINAL_GUARD_16643={runToken,targetSpan:targetSpan16643,cameraSpanBefore:cameraSpan16643,frameRatio:frameRatio16643,reasserted:reassert16643,at:new Date().toISOString()};
      if(reassert16643&&isCurrentRun(runToken))cameraReady16334=await settleRegionalCamera(m,b,runToken);
    }catch(error16643){window.EARTHLINE_CAMERA_FINAL_GUARD_16643={runToken,error:String(error16643),at:new Date().toISOString()};}`);
  return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_candidate16643='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
for(let repeat=1;repeat<=5;repeat++){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;
  try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:30000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(500);
  const state=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
    const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
    const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,a=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    return {swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,phases:p?.phaseTotalsMs??null,cameraGuard:window.EARTHLINE_CAMERA_FINAL_GUARD_16643||null,cameraAudit:window.EARTHLINE_REGIONAL_CAMERA_SETTLE_AUDIT_16334||null,gridW:flow?.gridAudit?.grid?.w??null,gridH:flow?.gridAudit?.grid?.h??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,aquifer:a,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
  });
  const row={repeat,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_TX_CANDIDATE_16643 '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_CANDIDATE_16643_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
const bad=rows.some(r=>r.timedOut||r.state.lastError||r.state.visible!==66||r.state.published!==66||!(r.state.totalMs<=15000)||Number(r.state.gridW)!==96||Number(r.state.gridH)!==96||Number(r.state.unsafe)!==0||Number(r.state.outside?.swales||0)!==0||r.state.zones.panhandleNorth<3||r.state.zones.upperCoast<8||r.state.zones.lowerCoast<5||r.state.zones.eastInterior<10);
if(bad)process.exitCode=1;
