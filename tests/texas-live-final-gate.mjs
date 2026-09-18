import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const rows=[],patches={};
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected 1 match, found '+n);body=body.replace(needle,replacement);};
  apply('landTiming',
`    const landValidityPromise16584=!focusMode
      ?earthlineResolveLandValidity16584(b,runToken)
      :Promise.resolve(null);
    const terrainStarted16198=performance.now();`,
`    const terrainSubphase16644=window.EARTHLINE_TERRAIN_SUBPHASE_16644={runToken,query:q,at:new Date().toISOString()};
    const landValidityStarted16644=performance.now();
    const landValidityPromise16584=Promise.resolve(!focusMode
      ?earthlineResolveLandValidity16584(b,runToken)
      :null).then(v16644=>{terrainSubphase16644.landValidityMs=Math.round(performance.now()-landValidityStarted16644);return v16644;},e16644=>{terrainSubphase16644.landValidityMs=Math.round(performance.now()-landValidityStarted16644);terrainSubphase16644.landValidityError=String(e16644);throw e16644;});
    const terrainStarted16198=performance.now();`);
  apply('demTiming',
`    const openTerrain16198=loadDEM(b,openGrid16201,openGrid16201,openBudget16353,openLabel16353);`,
`    const demStarted16644=performance.now();
    const openTerrain16198=loadDEM(b,openGrid16201,openGrid16201,openBudget16353,openLabel16353).then(v16644=>{terrainSubphase16644.demMs=Math.round(performance.now()-demStarted16644);terrainSubphase16644.demSource=v16644&&v16644.source||null;return v16644;},e16644=>{terrainSubphase16644.demMs=Math.round(performance.now()-demStarted16644);terrainSubphase16644.demError=String(e16644);throw e16644;});`);
  apply('maskTiming',
`        validityGrid16584=earthlineLandValidityMask16584(dem,landValidity16584);`,
`        const maskStarted16644=performance.now();
        validityGrid16584=earthlineLandValidityMask16584(dem,landValidity16584);
        terrainSubphase16644.landMaskMs=Math.round(performance.now()-maskStarted16644);`);
  apply('hydrologyValidTiming',
`          hy=await hydrology(dem,validityGrid16584.mask);`,
`          const hydrologyStarted16644=performance.now();
          hy=await hydrology(dem,validityGrid16584.mask);
          terrainSubphase16644.hydrologyMs=Math.round(performance.now()-hydrologyStarted16644);
          terrainSubphase16644.hydrologyMode='validity-mask';`);
  apply('hydrologyZeroTiming',
`          hy=await hydrology(dem,null);
        }
      }else{
        hy=await hydrology(dem,null);`,
`          const hydrologyStartedZero16644=performance.now();
          hy=await hydrology(dem,null);
          terrainSubphase16644.hydrologyMs=Math.round(performance.now()-hydrologyStartedZero16644);
          terrainSubphase16644.hydrologyMode='zero-validity-fallback';
        }
      }else{
        const hydrologyStartedUnavailable16644=performance.now();
        hy=await hydrology(dem,null);
        terrainSubphase16644.hydrologyMs=Math.round(performance.now()-hydrologyStartedUnavailable16644);
        terrainSubphase16644.hydrologyMode='land-validity-unavailable';`);
  apply('terrainFinalTiming',
`    phaseMark16198('terrainMs',terrainStarted16198);`,
`    phaseMark16198('terrainMs',terrainStarted16198);
    terrainSubphase16644.terrainMs=phase16198.terrainMs;
    terrainSubphase16644.waitAfterParallelMs=Math.max(0,phase16198.terrainMs-Math.max(Number(terrainSubphase16644.demMs||0),Number(terrainSubphase16644.landValidityMs||0))-Number(terrainSubphase16644.landMaskMs||0)-Number(terrainSubphase16644.hydrologyMs||0));`);
  apply('cameraFinalFrameGuard',
`    const cameraReady16334=await cameraSettle16310;`,
`    let cameraReady16334=await cameraSettle16310;
    try{
      const cb16644=m&&m.getBounds&&m.getBounds(),targetSpan16644=Math.max(Math.abs(b[2]-b[0]),Math.abs(b[3]-b[1]));
      const cameraSpan16644=cb16644?Math.max(Math.abs(cb16644.getEast()-cb16644.getWest()),Math.abs(cb16644.getNorth()-cb16644.getSouth())):Infinity;
      const frameRatio16644=targetSpan16644>0&&Number.isFinite(cameraSpan16644)?cameraSpan16644/targetSpan16644:Infinity;
      const reassert16644=frameRatio16644>4;
      window.EARTHLINE_CAMERA_FINAL_GUARD_16644={runToken,targetSpan:targetSpan16644,cameraSpanBefore:cameraSpan16644,frameRatio:frameRatio16644,reasserted:reassert16644,at:new Date().toISOString()};
      if(reassert16644&&isCurrentRun(runToken))cameraReady16334=await settleRegionalCamera(m,b,runToken);
    }catch(error16644){window.EARTHLINE_CAMERA_FINAL_GUARD_16644={runToken,error:String(error16644),at:new Date().toISOString()};}`);
  return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_terrain_profile16644='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
for(let repeat=1;repeat<=5;repeat++){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:30000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(450);
  const state=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
    const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
    const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    return {swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,phases:p?.phaseTotalsMs??null,terrainSubphase:window.EARTHLINE_TERRAIN_SUBPHASE_16644||null,cameraGuard:window.EARTHLINE_CAMERA_FINAL_GUARD_16644||null,gridW:flow?.gridAudit?.grid?.w??null,gridH:flow?.gridAudit?.grid?.h??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
  });
  const row={repeat,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_TX_TERRAIN_PROFILE_16644 '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_TERRAIN_PROFILE_16644_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
if(rows.some(r=>r.timedOut||r.state.lastError||r.state.visible!==66||r.state.published!==66||Number(r.state.gridW)!==96||Number(r.state.gridH)!==96||Number(r.state.unsafe)!==0||Number(r.state.outside?.swales||0)!==0))process.exitCode=1;
