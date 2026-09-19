import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch(); let body=await resp.text();
  const exact=(name,old,neu)=>{const n=body.split(old).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected 1, found '+n);body=body.replace(old,neu);};
  exact('makeSwalesAsync',
    "  function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null){",
    "  async function earthlineCooperativeYield16661(){if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();return new Promise(r=>setTimeout(r,0));}\n  async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null){");
  exact('eligibleCountAsync',
`    function jurisdictionEligibleCount16539(list16539){
      if(focusMode||!jurisdictionGeometry16539)return list16539.length;
      let count16539=0;
      for(const candidate16539 of list16539)if(screenJurisdictionCandidate16539(candidate16539))count16539++;
      return count16539;
    }`,
`    async function jurisdictionEligibleCount16539(list16539){
      if(focusMode||!jurisdictionGeometry16539)return list16539.length;
      let count16539=0,yieldCount16661=0;
      for(const candidate16539 of list16539){if(screenJurisdictionCandidate16539(candidate16539))count16539++;if((++yieldCount16661%12)===0)await earthlineCooperativeYield16661();}
      return count16539;
    }`);
  exact('eligibleAwait',"const preferredEligibleCount16539=jurisdictionEligibleCount16539(candidates);","const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);");
  exact('finalScreenYield',
`      const eligible16539=[];
      for(const candidate16539 of candidates){
        const screened16539=screenJurisdictionCandidate16539(candidate16539);
        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;
      }`,
`      const eligible16539=[];let finalScreenYield16661=0;
      for(const candidate16539 of candidates){
        const screened16539=screenJurisdictionCandidate16539(candidate16539);
        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;
        if((++finalScreenYield16661%12)===0)await earthlineCooperativeYield16661();
      }`);
  exact('makeSwalesAwait',"let swales=makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);","let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);");

  const fcRe=/  function earthlineClipFeatureCollection16539\(fc,g\)\{[\s\S]*?\n  \}\n  function earthlineOutsideCoordinateCount16539/;
  patches.clipFeatureAsync=(body.match(fcRe)||[]).length;
  if(patches.clipFeatureAsync!==1)throw new Error('clipFeatureAsync matches '+patches.clipFeatureAsync);
  body=body.replace(fcRe,`  async function earthlineClipFeatureCollection16539(fc,g){
    const out=[],features16661=(fc&&fc.features||[]);let featureIndex16661=0;
    for(const feature of features16661){
      if(feature&&feature.geometry){
        const geom=feature.geometry,props=Object.assign({},feature.properties||{});
        if(geom.type==='Point'){
          if(earthlinePointInJurisdiction16539(geom.coordinates,g))out.push({type:'Feature',properties:props,geometry:JSON.parse(JSON.stringify(geom))});
        }else{
          const lines=geom.type==='LineString'?[geom.coordinates]:geom.type==='MultiLineString'?(geom.coordinates||[]):[];
          for(const line of lines)for(const run of earthlineClipLine16539(line,g)){const safe=run;if(safe.length>=2)out.push({type:'Feature',properties:Object.assign({},props,{jurisdiction_boundary_screened:true}),geometry:{type:'LineString',coordinates:safe}});}
        }
      }
      if((++featureIndex16661%12)===0)await earthlineCooperativeYield16661();
    }
    return {type:'FeatureCollection',features:out};
  }
  async function earthlineOutsideCoordinateCount16539`);

  const outRe=/  async function earthlineOutsideCoordinateCount16539\(fc,g\)\{[^\n]*\}\n  function earthlineRerankRegionalSwales16539/;
  patches.outsideAsync=(body.match(outRe)||[]).length;
  if(patches.outsideAsync!==1)throw new Error('outsideAsync matches '+patches.outsideAsync);
  body=body.replace(outRe,`  async function earthlineOutsideCoordinateCount16539(fc,g){
    let outside=0,featureIndex16661=0;
    for(const f of (fc&&fc.features||[])){
      const geom=f&&f.geometry;
      if(geom){
        if(geom.type==='Point'){if(!earthlinePointInJurisdiction16539(geom.coordinates,g))outside++;}
        else{const lines=geom.type==='LineString'?[geom.coordinates]:geom.type==='MultiLineString'?(geom.coordinates||[]):[];for(const line of lines)for(const p of (line||[]))if(earthlineFinitePoint16539(p)&&!earthlinePointInJurisdiction16539(p,g))outside++;}
      }
      if((++featureIndex16661%16)===0)await earthlineCooperativeYield16661();
    }
    return outside;
  }
  function earthlineRerankRegionalSwales16539`);

  const regionalRe=/  function earthlineClipRegionalProducts16539\(payload,boundary\)\{[\s\S]*?\n  \}\n\n\n  \/\* EARTHLINE 16584/;
  patches.regionalClipAsync=(body.match(regionalRe)||[]).length;
  if(patches.regionalClipAsync!==1)throw new Error('regionalClipAsync matches '+patches.regionalClipAsync);
  body=body.replace(regionalRe,`  async function earthlineClipRegionalProducts16539(payload,boundary){
    const g=boundary&&(boundary.prepared||boundary.geometry);if(!g)throw new Error('administrative boundary geometry unavailable');
    const before={contours:Number(payload.contours&&payload.contours.features&&payload.contours.features.length||0),flows:Number(payload.flows&&payload.flows.features&&payload.flows.features.length||0),swales:Number(payload.swales&&payload.swales.features&&payload.swales.features.length||0)};
    const contours=await earthlineClipFeatureCollection16539(payload.contours,g);
    const flows=await earthlineClipFeatureCollection16539(payload.flows,g);
    const swales=earthlineRerankRegionalSwales16539(await earthlineClipFeatureCollection16539(payload.swales,g));
    const after={contours:contours.features.length,flows:flows.features.length,swales:swales.features.length};
    const outsideAfterClip={contours:await earthlineOutsideCoordinateCount16539(contours,g),flows:await earthlineOutsideCoordinateCount16539(flows,g),swales:await earthlineOutsideCoordinateCount16539(swales,g)};
    if(outsideAfterClip.contours||outsideAfterClip.flows||outsideAfterClip.swales)throw new Error('administrative boundary containment invariant failed');
    const audit={build:'EARTHLINE 16539',runToken:payload.runToken||null,query:String(payload.query||''),placeType:boundary.placeType,capability:boundary.capability,source:boundary.source,sourceTier:boundary.sourceTier,sourceVintage:boundary.sourceVintage||null,before,after,outsideAfterClip,removed:{contours:Math.max(0,before.contours-after.contours),flows:Math.max(0,before.flows-after.flows),swales:Math.max(0,before.swales-after.swales)},rule:'hydrology computed continuously on the full DEM envelope; only published Regional products are clipped to the selected administrative polygon',at:new Date().toISOString()};
    return {contours,flows,swales,audit};
  }


  /* EARTHLINE 16584`);
  exact('regionalClipAwait',"const bounded16539=earthlineClipRegionalProducts16539({contours,flows,swales,query:q,runToken},boundary16539);","const bounded16539=await earthlineClipRegionalProducts16539({contours,flows,swales,query:q,runToken},boundary16539);");

  return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_chunked_ui='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(let repeat=1;repeat<=5;repeat++){
 const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));
 await page.evaluate(()=>{
   window.__earthlineFrameProbe={frames:0,maxGap:0,last:performance.now(),stopped:false};
   const tick=t=>{const p=window.__earthlineFrameProbe;if(!p||p.stopped)return;const g=t-p.last;if(g>p.maxGap)p.maxGap=g;p.last=t;p.frames++;requestAnimationFrame(tick);};requestAnimationFrame(tick);
 });
 const started=Date.now();
 await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(900);
 const state=await page.evaluate(()=>{
   if(window.__earthlineFrameProbe)window.__earthlineFrameProbe.stopped=true;
   const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
   const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
   const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
   const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,a=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
   return {frameProbe:window.__earthlineFrameProbe||null,swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,outside:b?.outsideAfterClip??null,before:b?.before??null,after:b?.after??null,aquifer:a,unsafe:flow?.unsafeSegments??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
 });
 const row={repeat,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_TX_CHUNKED_UI '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_CHUNKED_UI_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
const bad=rows.some(r=>r.timedOut||r.state.lastError||!(r.state.totalMs<=15000)||r.state.visible!==66||r.state.published!==66||Number(r.state.unsafe)!==0||Number(r.state.outside?.swales||0)!==0||r.state.zones.panhandleNorth<3||r.state.zones.upperCoast<8||r.state.zones.lowerCoast<5||r.state.zones.eastInterior<10||Number(r.state.frameProbe?.maxGap||99999)>1500);
if(bad)process.exitCode=1;
