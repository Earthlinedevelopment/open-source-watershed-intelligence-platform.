import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const rows=[],patches={};
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected 1 match, found '+n);body=body.replace(needle,replacement);};
  apply('jurisdictionPointCache',
`  function earthlinePointInJurisdiction16539(p,g){
    if(!g)return false;
    const prepared=earthlinePrepareJurisdiction16539(g);if(!prepared)return false;
    for(const poly of prepared.polygons||[]){if(!earthlineBBoxContains16539(poly.bbox,p)||!earthlinePointInRing16539(p,poly.outer))continue;let inHole=false;for(const h of poly.holes||[]){if(earthlineBBoxContains16539(h.bbox,p)&&earthlinePointInRing16539(p,h.ring)){inHole=true;break;}}if(!inHole)return true;}
    return false;
  }`,
`  const earthlinePointCacheByPrepared16642=new WeakMap();
  function earthlinePointInJurisdiction16539(p,g){
    if(!g)return false;
    const prepared=earthlinePrepareJurisdiction16539(g);if(!prepared)return false;
    let cache16642=earthlinePointCacheByPrepared16642.get(prepared);if(!cache16642){cache16642=new WeakMap();earthlinePointCacheByPrepared16642.set(prepared,cache16642);}
    if(p&&typeof p==='object'&&cache16642.has(p))return cache16642.get(p);
    let result16642=false;
    for(const poly of prepared.polygons||[]){if(!earthlineBBoxContains16539(poly.bbox,p)||!earthlinePointInRing16539(p,poly.outer))continue;let inHole=false;for(const h of poly.holes||[]){if(earthlineBBoxContains16539(h.bbox,p)&&earthlinePointInRing16539(p,h.ring)){inHole=true;break;}}if(!inHole){result16642=true;break;}}
    if(p&&typeof p==='object')cache16642.set(p,result16642);return result16642;
  }`);
  apply('swaleFinalClipReuse',
`const contours=earthlineClipFeatureCollection16539(payload.contours,g),flows=earthlineClipFeatureCollection16539(payload.flows,g),swales=earthlineRerankRegionalSwales16539(earthlineClipFeatureCollection16539(payload.swales,g));`,
`const contours=earthlineClipFeatureCollection16539(payload.contours,g),flows=earthlineClipFeatureCollection16539(payload.flows,g),alreadyScreenedSwales16642=!!(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167&&window.EARTHLINE_SWALE_GENERATION_AUDIT_16167.jurisdictionSelectionOrder==='jurisdiction-before-ranking-spacing-capacity'),swales=earthlineRerankRegionalSwales16539(alreadyScreenedSwales16642?{type:'FeatureCollection',features:(payload.swales&&payload.swales.features||[]).map(f16642=>({type:'Feature',properties:Object.assign({},f16642.properties||{},{jurisdiction_boundary_screened:true}),geometry:f16642.geometry}))}:earthlineClipFeatureCollection16539(payload.swales,g));`);
  apply('cameraFinalFrameGuard',
`    const cameraReady16334=await cameraSettle16310;`,
`    let cameraReady16334=await cameraSettle16310;
    try{
      const cb16642=m&&m.getBounds&&m.getBounds(),targetSpan16642=Math.max(Math.abs(b[2]-b[0]),Math.abs(b[3]-b[1]));
      const cameraSpan16642=cb16642?Math.max(Math.abs(cb16642.getEast()-cb16642.getWest()),Math.abs(cb16642.getNorth()-cb16642.getSouth())):Infinity;
      const reassert16642=Number.isFinite(cameraSpan16642)&&Number.isFinite(targetSpan16642)&&targetSpan16642>0&&cameraSpan16642>targetSpan16642*4;
      window.EARTHLINE_CAMERA_FINAL_GUARD_16642={runToken,targetSpan:targetSpan16642,cameraSpanBefore:cameraSpan16642,reasserted:reassert16642,at:new Date().toISOString()};
      if(reassert16642&&isCurrentRun(runToken))cameraReady16334=await settleRegionalCamera(m,b,runToken);
    }catch(error16642){window.EARTHLINE_CAMERA_FINAL_GUARD_16642={runToken,error:String(error16642),at:new Date().toISOString()};}`);
  return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_candidate='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
for(let repeat=1;repeat<=3;repeat++){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;
  try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:30000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(700);
  const state=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
    const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
    const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,a=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null;
    return {swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,phases:p?.phaseTotalsMs??null,cameraGuard:window.EARTHLINE_CAMERA_FINAL_GUARD_16642||null,cameraAudit:window.EARTHLINE_REGIONAL_CAMERA_SETTLE_AUDIT_16334||null,outside:b?.outsideAfterClip??null,aquifer:a,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
  });
  const row={repeat,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_TX_CANDIDATE_16642 '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_CANDIDATE_16642_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
const bad=rows.some(r=>r.timedOut||r.state.lastError||r.state.visible!==66||r.state.published!==66||!(r.state.totalMs<=15000)||Number(r.state.outside?.swales||0)!==0||r.state.zones.panhandleNorth<3||r.state.zones.upperCoast<8||r.state.zones.lowerCoast<5||r.state.zones.eastInterior<10);
if(bad)process.exitCode=1;
