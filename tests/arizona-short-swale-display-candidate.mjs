// Repeat-run scientific acceptance against unchanged pinned HTML; no live changes.
import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
fs.mkdirSync('artifacts/az-short-display',{recursive:true});
const BASE='https://earthlinedevelopment.org/';
const targetBlob='8474081675fdf904af8d805a28617ff673e6a525'; // exact deployed Git blob
const cases=[
 {name:'ArizonaScreenshot',lat:34.21568,lng:-111.93067}
];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const output=[];
for(const site of cases){
 const ctx=await browser.newContext({viewport:{width:1500,height:900},serviceWorkers:'block'});
 const page=await ctx.newPage();
 const errs=[];
 page.on('pageerror',e=>errs.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await page.route('https://earthlinedevelopment.org/**',async route=>{
   const u=new URL(route.request().url());
   if(u.pathname==='/'||u.pathname==='/index.html'){
     return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:fs.readFileSync('index.html')});
   }
   return route.continue();
 });
 let outcome={site,errors:errs};
 try{
  const response=await page.goto(BASE+'?verify_live_property4='+site.name+'&t='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  if(response?.status()!==200)throw new Error('Unexpected live HTML status '+response?.status());
  const html=await response.body();
  const {createHash}=await import('node:crypto');
  const actualSha=createHash('sha256').update(html).digest('hex');
  if(actualSha!=='cad72163fe5df8b5456291594081542d0b365c18a84f06e6075c1e399c02c462')throw new Error('CANDIDATE HTML SHA MISMATCH '+actualSha);
  await page.waitForFunction(()=>typeof window.earthlineSetPropertyTarget16201==='function'&&typeof window.earthlineDeclarePropertyAtCrosshair16173==='function',{},{timeout:60000});
  await page.waitForSelector('#earthlineDeclareProperty16169',{state:'attached',timeout:60000});
  await page.evaluate(t=>{
    const map=(typeof earthlineMap!=='undefined'?earthlineMap:null);
    map?.jumpTo?.({center:[t.lng,t.lat],zoom:17});
    window.earthlineSetPropertyTarget16201({lat:t.lat,lng:t.lng,source:'candidate-acceptance'},{openPanel:false});

  },site);
  await page.click('#earthlineDeclareProperty16169',{timeout:10000}); // real pointer click, exactly once
  let timeout=false;
  try{await page.waitForFunction(()=>{
    const m=(typeof M!=='undefined'?M:window.M);
    return m?.propertyPublication15816?.committed===true||m?.propertyPublication15816?.blocked===true;
  },null,{timeout:130000,polling:500})}
  catch{timeout=true}
  await page.waitForTimeout(2500); // permit independently published terrain/label overlays to settle
  outcome=await page.evaluate(t=>{
    const m=(typeof M!=='undefined'?M:window.M);
    const p=m?.propertyPublication15816||null;
    const map=(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const source=id=>{try{return map?.getSource?.(id)}catch{return null}};
    const count=id=>{let x=source(id);return x?._data?.features?.length??null};
    const layer=id=>{try{return map?.getLayoutProperty?.(id,'visibility')??null}catch{return null}};
    const drawn=id=>{try{return map?.getLayer?.(id)?map.queryRenderedFeatures({layers:[id]}).length:0}catch{return 0}};
    return {site:t,pub:p,swales:m?.swales?.length,vector:m?.vectorNoBuildCoverage||null,
       pipeline:((m?.swales||[]).map(sw=>{try{
 const split=earthlineSplitUsableSegments(sw.pts,4);
 const threshold=Math.max(20,((m.swaleMeta&&m.swaleMeta.targetSpacingM)||30)*0.82);
 return {id:sw.id,isSite:sw.isSite,rawPts:sw.pts?.length,rawLengthM:earthlinePathLengthM(sw.pts),
   goodPts:sw.pts?.filter(p=>earthlinePathPointUsable(p[0],p[1],4)).length,
   rawSlopePcts:sw.pts?.slice(0,20).map(p=>Number(slopePct(Math.round(p[0]),Math.round(p[1])).toFixed(2))),
   splits:split.map(seg=>{const smooth=earthlineNaturalContourDisplay(seg);
     const finals=earthlineFinalSafeSegments15771(smooth,4);
     return {originalM:earthlinePathLengthM(seg),passesVisibilityLength:earthlinePathLengthM(seg)>=threshold||sw.isSite,
       smoothedLengthM:earthlinePathLengthM(smooth),finalM:finals.map(earthlinePathLengthM)};})};
 }catch(e){return {error:String(e)}}})),generatedGeojson:(typeof earthlineSwaleGeoJSON==='function'?earthlineSwaleGeoJSON().features.length:null),swaleLayerSource:(typeof EARTHLINE_SWALE_SOURCE!=='undefined'?EARTHLINE_SWALE_SOURCE:null),swaleLayerVisibility:(typeof EARTHLINE_SWALE_LAYER!=='undefined'?layer(EARTHLINE_SWALE_LAYER):null),swaleMapFeatureCount:(typeof EARTHLINE_SWALE_SOURCE!=='undefined'?count(EARTHLINE_SWALE_SOURCE):null),slopeStats:(()=>{if(!m?.inP||!m?.dem)return null;let n=0,eligible=0;for(let y=1;y<GH-1;y++)for(let x=1;x<GW-1;x++){if(!m.inP[idx(x,y)])continue;n++;if(slopePct(x,y)<=4)eligible++}return {n,eligible,percent:100*eligible/(n||1)}})(),tier:document.documentElement.dataset.earthlineAnalysisTier,demSource:m?.demSource,integrity:window.EARTHLINE_LOCATION_INTEGRITY_15801||null,
       gauge:document.querySelector('.earthline-recharge-gauge-label-16488')?.textContent,
       contoursAudit:window.earthlineElevationAudit15776?.()||null,drawnElevationLabels:drawn('earthline-official-contour-label-15776'),recharge:count('earthline-recharge-zones'),
       owner:m?.rendererOwnership15805||null,layerVisibility:{
         contours:layer('earthline-official-contour-major-15776'),elevationLabels:layer('earthline-official-contour-label-15776'),recharge:layer('earthline-recharge-line')
       },generation:m?.searchGen};
  },site);
  outcome.syncProbe=await page.evaluate(()=>{
    const m=(typeof M!=='undefined'?M:window.M);
    const before={layerOn:m?.layers?.swales?.on,analysisReady:m?.analysisReady,terrainReady:m?.terrainReady,
      sourceCount:(typeof EARTHLINE_SWALE_SOURCE!=='undefined'?earthlineMap?.getSource?.(EARTHLINE_SWALE_SOURCE)?._data?.features?.length:null),
      mapActive:(typeof earthlineMapActive==='function'?earthlineMapActive():null),
      ensureAudit:window.EARTHLINE_SWALE_LAYER_ENSURE_AUDIT_16500||null,
      regionalState:window.earthlineRegional15778?{mode:window.earthlineRegional15778.mode,active:window.earthlineRegional15778.active}:null,
      lock:m?.propertyResultLock15815?{verified:m.propertyResultLock15815.safetyVerified,safeSegments:m.propertyResultLock15815.safeSegments}:null,
      safetyAudit:m?.safetyAudit15806?{verified:m.safetyAudit15806.verified,acceptedIntersections:m.safetyAudit15806.acceptedIntersections}:null,
      authorizedCount:m?.authoritativeSafeSwales15815?.features?.length,
      living:m?.livingSwaleRenderer15792||null,
      livingSourceCount:earthlineMap?.getSource?.('earthline-living-swales-15792')?._data?.features?.length,
      livingVisibility:earthlineMap?.getLayoutProperty?.('earthline-living-swales-life-15792','visibility')};
    const syncResult=(typeof earthlineSyncSwaleLayer==='function'?earthlineSyncSwaleLayer():null);
    return {before,syncResult,after:{sourceCount:(typeof EARTHLINE_SWALE_SOURCE!=='undefined'?earthlineMap?.getSource?.(EARTHLINE_SWALE_SOURCE)?._data?.features?.length:null),
       visibility:(typeof EARTHLINE_SWALE_LAYER!=='undefined'?earthlineMap?.getLayoutProperty?.(EARTHLINE_SWALE_LAYER,'visibility'):null),
       ensureAudit:window.EARTHLINE_SWALE_LAYER_ENSURE_AUDIT_16500||null}};
  });
  console.log('ARIZONA_SWALE_SYNC_PROBE '+JSON.stringify(outcome.syncProbe));
  outcome.timeout=timeout;
  outcome.errors=errs;
  await page.screenshot({path:'artifacts/property4-candidate/'+site.name.toLowerCase()+'.png',timeout:20000});
 }catch(e){outcome.failure=String(e);outcome.errors=errs;}
 output.push(outcome);
 console.log('PROPERTY4_CANDIDATE_CASE '+JSON.stringify(outcome));
 await ctx.close();
}
await browser.close();
const passed=output.every(o=>o.generatedGeojson>0&&o.swaleMapFeatureCount>0&&o.swaleLayerVisibility==='visible'&&!o.failure&&!o.timeout&&o.pub?.committed===true&&o.pub?.safetyVerified===true&&o.gauge==='Recharge Potential'&&!/procedural|generated screening fallback/i.test(String(o.demSource||''))&&o.contoursAudit?.sourcePresent===true&&o.contoursAudit?.majorPresent===true&&o.contoursAudit?.labelPresent===true&&o.layerVisibility?.contours!=='none'&&o.layerVisibility?.elevationLabels!=='none'&&!(o.errors||[]).some(e=>/Uncaught|ReferenceError/i.test(e)))&&output.every(o=>o.recharge>0);
const result={targetBlob,passed,output};
fs.writeFileSync('artifacts/property4-candidate/result.json',JSON.stringify(result,null,2));
console.log('PROPERTY4_CANDIDATE_RESULT '+JSON.stringify({passed,sites:output.map(o=>({name:o.site?.name,timeout:o.timeout,swales:o.swales,segments:o.pub?.safeSegments,blocked:o.pub?.blocked,reason:o.pub?.blockReason,gauge:o.gauge}))}));
if(!passed)process.exitCode=1;