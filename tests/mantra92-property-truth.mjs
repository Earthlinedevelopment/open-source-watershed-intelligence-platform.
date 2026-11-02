import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';

const URL='https://earthlinedevelopment.org/';
const TARGETS=[
  {name:'crosshair-control',lng:-111.93087,lat:34.21592},
  {name:'control-2',lng:-111.93456,lat:34.21545}
];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:950}});
const pageErrors=[],badResponses=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')pageErrors.push(m.text())});
page.on('response',r=>{if(r.status()>=400)badResponses.push({status:r.status(),url:r.url()})});
mkdirSync('artifacts/property-truth',{recursive:true});

await page.goto(URL+'?az_control='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Arizona';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let regionalTimeout=false;
try{await page.waitForFunction(()=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;return !!e||(Number(p?.generated||0)>0&&Number(d?.swaleLines||0)>0);},null,{timeout:35000,polling:150});}catch(_){regionalTimeout=true}
const regionalDiagnostic=await page.evaluate(()=>{
  const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
  const boundary=pkg?.boundary||null,prepared=boundary?.prepared||null;
  const polys=(prepared?.polygons||[]).map(p=>({bbox:p.bbox,outerFirst:p.outer?.[0]||null,outerCount:p.outer?.length||0,holeCount:p.holes?.length||0}));
  const md=(typeof M!=='undefined'&&M)||window.M||null;
  const gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
  const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
  const extent=window.EARTHLINE_REGIONAL_ANALYSIS_EXTENT_16712||null;
  const land=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null;
  const geom=window.EARTHLINE_REGIONAL_GEOMETRY_M84||null;
  const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
  const error=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
  const centerPoint=[Number(pkg?.center?.lng),Number(pkg?.center?.lat)];
  let centerInside=null,cornerInside=null,pointFnType=typeof window.earthlinePointInJurisdiction16539;
  try{if(typeof window.earthlinePointInJurisdiction16539==='function'){centerInside=window.earthlinePointInJurisdiction16539(centerPoint,prepared||boundary?.geometry);cornerInside=window.earthlinePointInJurisdiction16539([-112,34],prepared||boundary?.geometry);}}catch(_){}
  let contourSource=null,contourBBox=null,contourSample=null;
  try{
    const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
    for(const id of ['el-live-contours-15970','el-live-contours','earthline-live-contours']){
      const src=map?.getSource?.(id);const d=src?._data||src?.serialize?.()?.data||null;
      if(d?.features?.length){contourSource=id;const pts=[];for(const ft of d.features.slice(0,20)){const co=ft?.geometry?.coordinates;if(ft?.geometry?.type==='LineString'&&Array.isArray(co)){for(const p of co.slice(0,20))if(Array.isArray(p)&&p.length>=2)pts.push(p);}}if(pts.length){contourBBox=[Math.min(...pts.map(p=>Number(p[0]))),Math.min(...pts.map(p=>Number(p[1]))),Math.max(...pts.map(p=>Number(p[0]))),Math.max(...pts.map(p=>Number(p[1])))];contourSample=pts[0];}break;}
    }
  }catch(_){}
  return {pkg:{profileId:pkg?.profileId,center:pkg?.center,extent:pkg?.regionalExtent,boundaryLabel:boundary?.label,boundaryCode:boundary?.code,boundaryType:boundary?.geometry?.type,polys},model:{loc:md?.loc,centerLng:md?.centerLng,centerLat:md?.centerLat,analysisBoundary:md?.analysisBoundaryLngLat,bounds:md?.bounds},membership:{pointFnType,centerPoint,centerInside,cornerInside},contourSource,contourBBox,contourSample,gen,pub,extent,land,geom,perf,error,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),tier:String(document.getElementById('earthlineTierNotice16173')?.textContent||'')};
});
writeFileSync('artifacts/property-truth/regional-diagnostic.json',JSON.stringify({regionalTimeout,regionalDiagnostic,pageErrors,badResponses},null,2));
console.log('ARIZONA_REGIONAL_DIAGNOSTIC '+JSON.stringify({regionalTimeout,regionalDiagnostic,pageErrors:pageErrors.slice(-10),badResponses:badResponses.slice(-10)}));
/* The refinement stages can leave an interim generation audit at zero after publishing actual final Regional corridors. Gate on the final publisher and delivered result. */
const finalRegionalCount=Math.max(Number(regionalDiagnostic.pub?.generated||0),Number(regionalDiagnostic.perf?.swales||0));
const azCenter=regionalDiagnostic.pkg?.center||null;
const azBounds=regionalDiagnostic.pkg?.extent?.bbox||null;
const regionalCenterPass=!!azCenter&&Array.isArray(azBounds)&&azBounds.length===4&&
  Number.isFinite(Number(azCenter.lng))&&Number.isFinite(Number(azCenter.lat))&&
  Number(azCenter.lng)>azBounds[0]&&Number(azCenter.lng)<azBounds[2]&&
  Number(azCenter.lat)>azBounds[1]&&Number(azCenter.lat)<azBounds[3];
console.log('ARIZONA_CENTER_GATE '+JSON.stringify({regionalCenterPass,center:azCenter,bounds:azBounds,finalRegionalCount}));
if(regionalTimeout||regionalDiagnostic.error||!regionalCenterPass||finalRegionalCount===0){await browser.close();process.exit(1);} 

async function runTarget(target,index){
  const errorStart=pageErrors.length;
  const prep=await page.evaluate(async target=>{
    if(typeof M==='undefined')return {ok:false,reason:'M unavailable'};
    const site=window.earthlineSelectedSiteFromCenter?.(M?.loc||null,target.lng,target.lat,20);
    if(!site)return {ok:false,reason:'site unavailable'};
    const applied=await window.applyLocation?.(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false,reason:'applyLocation rejected site'};
    await new Promise(r=>setTimeout(r,800));
    const set=window.earthlineSetPropertyTarget16201?.({lng:target.lng,lat:target.lat,source:'mantra85-arizona-control'},{openPanel:false});
    return {ok:!!set};
  },target);
  if(!prep.ok)throw new Error(target.name+' prep failed: '+prep.reason);
  const started=Date.now();
  const out=await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169?.());
  await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return a.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';},null,{timeout:45000,polling:120});
  await page.waitForTimeout(900);
  const snap=await page.evaluate(target=>{
    const md=(typeof M!=='undefined'&&M)||window.M||null;
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    const safe=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null;
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null;
    const naturalIds=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177','earthline-swale-planting-shadow-15806','earthline-swale-planting-layer-15806'];
    const safeIds=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'];
    const vis=id=>{try{return map?.getLayer?.(id)?map.getLayoutProperty(id,'visibility')||'visible':'missing'}catch(_){return 'error'}};
    return {
      target,
      audit:a,publication:p,safeVisibility:safe,elder:e,
      displayedTier:String(d?.tier||d?.mode||''),
      modelCenter:{lng:Number(md?.centerLng),lat:Number(md?.centerLat)},
      safeCount:Number(md?.authoritativeSafeSwales15815?.features?.length||0),
      engineCount:Number(md?.swales?.length||0),
      naturalLayers:Object.fromEntries(naturalIds.map(id=>[id,vis(id)])),
      safeLayers:Object.fromEntries(safeIds.map(id=>[id,vis(id)])),
      tierNotice:String(document.getElementById('earthlineTierNotice16173')?.textContent||''),
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'')
    };
  },target);
  await page.screenshot({path:`artifacts/property-truth/az-${index+1}.png`,fullPage:false});
  const centerPass=Math.abs(Number(snap.audit?.center?.lng)-target.lng)<1e-5&&Math.abs(Number(snap.audit?.center?.lat)-target.lat)<1e-5;
  const safePass=snap.audit?.settled===true&&snap.audit?.result===true&&snap.publication?.published===true&&snap.safeCount>0&&snap.safeVisibility?.visible===true&&Number(snap.safeVisibility?.count||0)===snap.safeCount;
  const elderPass=snap.elder?.state==='committed'&&Number(snap.elder?.featureCount||0)>0&&String(snap.elder?.propertyRunIdentity||'').startsWith(target.lng.toFixed(6)+'|'+target.lat.toFixed(6)+'|');
  const tierPass=snap.displayedTier==='property';
  const newErrors=pageErrors.slice(errorStart);
  return {name:target.name,elapsedMs:Date.now()-started,out,centerPass,safePass,elderPass,tierPass,newErrors,snap,pass:centerPass&&safePass&&elderPass&&tierPass&&newErrors.length===0};
}
const rows=[];
for(let i=0;i<TARGETS.length;i++) rows.push(await runTarget(TARGETS[i],i));
const forensic=await page.evaluate(()=>{
 const md=(typeof M!=='undefined'&&M)||window.M||null;
 const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
 const layers=map?.getStyle?.()?.layers||[];
 const interesting=layers.filter(x=>/earthline-property|swale|aquifer|groundwater|hydrography|water-path|water-line/i.test(x.id||''));
 const layerAudit=interesting.map(l=>{
   let visibility='missing',paint={},featureCount=null;
   try{visibility=map.getLayoutProperty(l.id,'visibility')||'visible';paint=Object.fromEntries(
     ['line-opacity','line-width','line-color','fill-opacity','circle-opacity'].map(k=>[k,map.getPaintProperty(l.id,k)])
     .filter(x=>x[1]!==undefined));
    const src=map.getSource(l.source);featureCount=src?._data?.features?.length??null;}catch{}
   return {id:l.id,type:l.type,visibility,paint,featureCount};
 });
 const dims={GW:typeof GW==='number'?GW:null,GH:typeof GH==='number'?GH:null,cellM:md?.cellM??null};
 let inProperty=0,withinSlope=0,pond=0,build=0,usable=0,steep=0,slopes=[],missingSlope=0;
 if(typeof GW==='number'&&typeof GH==='number'&&md?.inP&&typeof slopePct==='function'){
   for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){
     const i=y*GW+x;if(!md.inP[i])continue;
     inProperty++;const z=Number(slopePct(x,y));
     if(!Number.isFinite(z)){missingSlope++;continue;}
     slopes.push(z);if(z<=4){withinSlope++;
       if(md.pond?.[i])pond++;
       else if(typeof earthlineNoBuildBuffered==='function'&&earthlineNoBuildBuffered(x,y))build++;
       else if(typeof earthlinePathPointUsable==='function'&&earthlinePathPointUsable(x,y,4))usable++;
     }else steep++;
   }
 }
 slopes.sort((a,b)=>a-b);
 const quant=q=>slopes.length?slopes[Math.floor(q*(slopes.length-1))]:null;
 const src=md?.authoritativeSafeSwales15815?.features||[];
 const engine=md?.swales||[];
 return {dims,grid:{inProperty,withinSlope,pond,build,usable,steep,missingSlope,
      p10:quant(.1),p50:quant(.5),p90:quant(.9),p99:quant(.99)},
   candidateEngineCount:engine.length,safeCount:src.length,swaleMeta:md?.swaleMeta||null,
   textureAudit:window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169||null,
   safeVisible:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
   publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
   run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
   noBuildAudit:window.EARTHLINE_PROPERTY_PUBLICATION_BLOCK_16176||null,
   waterAudit:window.EARTHLINE_WATER_SIDECAR_AUDIT_16584||null,
   mapLayers:layerAudit,runState:document.documentElement.dataset.earthlinePropertyRunState||null,
   status:document.getElementById('earthlineVermontStatus16147')?.textContent||null};
});
console.log('M92_PROPERTY_FORENSICS '+JSON.stringify(forensic));
console.log('M92_PROPERTY_ALL_RESULTS '+JSON.stringify(rows.map(r=>({name:r.name,pass:r.pass,
elapsedMs:r.elapsedMs,engineCount:r.snap.engineCount,safeCount:r.snap.safeCount,
elder:r.snap.elder?.featureCount,center:r.snap.modelCenter,publication:r.snap.publication,
audit:r.snap.audit,safeVisibility:r.snap.safeVisibility,naturalLayers:r.snap.naturalLayers,
safeLayers:r.snap.safeLayers}))));
const replacementPass=rows.length===2&&rows[0].snap.publication?.runToken!==rows[1].snap.publication?.runToken&&Math.abs(Number(rows[1].snap.audit?.center?.lng)-TARGETS[1].lng)<1e-5;
const report={at:new Date().toISOString(),url:URL,rows,replacementPass,pageErrors,badResponses,pass:rows.every(r=>r.pass)&&replacementPass};
writeFileSync('artifacts/property-truth/results.json',JSON.stringify(report,null,2));
console.log('M92_PROPERTY_TEST '+JSON.stringify({pass:report.pass,replacementPass,rows:rows.map(r=>({name:r.name,pass:r.pass,elapsedMs:r.elapsedMs,safeCount:r.snap.safeCount,elderCount:r.snap.elder?.featureCount||0,natural:r.snap.naturalLayers,safe:r.snap.safeLayers,errors:r.newErrors}))}));
await browser.close();
if(!report.pass)process.exitCode=1;
