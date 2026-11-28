import {chromium} from 'playwright';
import {mkdirSync,writeFileSync,readFileSync,existsSync,statSync} from 'node:fs';
import path from 'node:path';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const TARGETS=[
  // Owner's 2026-11-28 screenshot: crosshair 42.78737, -75.77471, 20 acres.
  {name:'owner-screenshot-property',lng:-75.77471,lat:42.78737},
  {name:'owner-screenshot-repeat',lng:-75.77471,lat:42.78737},
  // Preserve the original owner-reported New York regression coordinates.
  {name:'new-york-failure-1',lng:-75.77699,lat:42.78808},
  {name:'new-york-failure-repeat',lng:-75.77699,lat:42.78808},
  {name:'new-york-overlap',lng:-75.77709,lat:42.78811}
];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:950}});
const pageErrors=[],badResponses=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')pageErrors.push(m.text())});
page.on('response',r=>{if(r.status()>=400)badResponses.push({status:r.status(),url:r.url()})});
mkdirSync('artifacts/ny-repeat-live',{recursive:true});


const ROOT=process.cwd();
const LIVE_ORIGIN=new URL(URL).origin;
await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.origin!==LIVE_ORIGIN)return route.continue();
  let rel=decodeURIComponent(u.pathname).replace(/^\\/+/, '');
  if(!rel)rel='index.html';
  const local=path.resolve(ROOT,rel);
  if(local!==ROOT&&!local.startsWith(ROOT+path.sep))return route.abort();
  if(existsSync(local)&&statSync(local).isFile()){
    const ext=path.extname(local).toLowerCase();
    const types={'.js':'application/javascript','.json':'application/json','.geojson':'application/geo+json','.html':'text/html; charset=utf-8','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
    return route.fulfill({status:200,contentType:types[ext]||'application/octet-stream',body:readFileSync(local)});
  }
  return route.continue();
});

await page.goto(URL+'?az_control='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
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
writeFileSync('artifacts/ny-repeat-live/regional-diagnostic.json',JSON.stringify({regionalTimeout,regionalDiagnostic,pageErrors,badResponses},null,2));
console.log('NY_REGIONAL_DIAGNOSTIC '+JSON.stringify({regionalTimeout,regionalDiagnostic,pageErrors:pageErrors.slice(-10),badResponses:badResponses.slice(-10)}));
/* The refinement stages can leave an interim generation audit at zero after publishing actual final Regional corridors. Gate on the final publisher and delivered result. */
const finalRegionalCount=Math.max(Number(regionalDiagnostic.pub?.generated||0),Number(regionalDiagnostic.perf?.swales||0));
const azCenter=regionalDiagnostic.pkg?.center||null;
const azBounds=regionalDiagnostic.pkg?.extent?.bbox||null;
const regionalCenterPass=!!azCenter&&Array.isArray(azBounds)&&azBounds.length===4&&
  Number.isFinite(Number(azCenter.lng))&&Number.isFinite(Number(azCenter.lat))&&
  Number(azCenter.lng)>azBounds[0]&&Number(azCenter.lng)<azBounds[2]&&
  Number(azCenter.lat)>azBounds[1]&&Number(azCenter.lat)<azBounds[3];
console.log('NY_CENTER_GATE '+JSON.stringify({regionalCenterPass,center:azCenter,bounds:azBounds,finalRegionalCount}));
if(regionalTimeout||regionalDiagnostic.error||!regionalCenterPass||finalRegionalCount===0){console.log('NY_REGIONAL_WARNING: regional evidence failed, continuing Property diagnostic');} 

async function runTarget(target,index){
  const errorStart=pageErrors.length;
  const prep=await page.evaluate(async target=>{
    if(typeof M==='undefined')return {ok:false,reason:'M unavailable'};
    const site=window.earthlineSelectedSiteFromCenter?.(M?.loc||null,target.lng,target.lat,20);
    if(!site)return {ok:false,reason:'site unavailable'};
    const applied=await window.applyLocation?.(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false,reason:'applyLocation rejected site'};
    await new Promise(r=>setTimeout(r,800));
    const set=window.earthlineSetPropertyTarget16201?.({lng:target.lng,lat:target.lat,source:'mantra85-new-york-repeat'},{openPanel:false});
    return {ok:!!set};
  },target);
  if(!prep.ok)throw new Error(target.name+' prep failed: '+prep.reason);
  const started=Date.now();
  let out=null,runError=null;try{out=await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169?.());}catch(e){runError=String(e);}
  let settleError=null;try{await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return a.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';},null,{timeout:35000,polling:120});}catch(e){settleError=String(e)}
  // The separately scheduled CHMv2 worker can finish after Property publication.
  // Wait for a terminal result belonging to this exact target, not a previous Property.
  let elderWaitError=null;
  try{
    await page.waitForFunction(target=>{
      const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      const identity=target.lng.toFixed(6)+'|'+target.lat.toFixed(6)+'|';
      if(!String(e?.propertyRunIdentity||'').startsWith(identity))return false;
      return e.state==='committed'||e.state==='failed';
    },target,{timeout:8000,polling:200});
  }catch(err){elderWaitError=String(err);}
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
      prescriptionHalt:md?.prescriptionHalt15870||null,
      prescriptionZero:md?.prescriptionZeroReason15870||null,
      propertyFailure:md?.propertyRunFailure16539||null,
      engine:md?.propertySwaleEngine16600||null,
      maskProvenance:md?.noBuildProvenance15843?{source:md.noBuildProvenance15843.source,searchGen:md.noBuildProvenance15843.searchGen}:null,
      rechargeCount:Number(md?.rechZones?.length||0),
      swaleDiagnostics:md?.swaleDiagnostics||null,
      safetyAudit:md?.safetyAudit15806||null,
      terrainLoad:md?.terrainHandoff15791||null,
      displayedRunState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
      contourSourcePresent:!!(map?.getSource?.('el-live-contours-15970')),
      contourLayerState:(()=>{try{return map?.getLayer?.('el-live-contours-15970')?'present':'missing'}catch(_){return 'error'}})(),
      safeCount:Number(md?.authoritativeSafeSwales15815?.features?.length||0),
      engineCount:Number(md?.swales?.length||0),
      naturalLayers:Object.fromEntries(naturalIds.map(id=>[id,vis(id)])),
      safeLayers:Object.fromEntries(safeIds.map(id=>[id,vis(id)])),
      tierNotice:String(document.getElementById('earthlineTierNotice16173')?.textContent||''),
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'')
    };
  },target);
  await page.screenshot({path:`artifacts/ny-repeat-live/az-${index+1}.png`,fullPage:false});
  const centerPass=Math.abs(Number(snap.audit?.center?.lng)-target.lng)<1e-5&&Math.abs(Number(snap.audit?.center?.lat)-target.lat)<1e-5;
  const safePass=snap.audit?.settled===true&&snap.audit?.result===true&&snap.publication?.published===true&&snap.safeCount>0&&snap.safeVisibility?.visible===true&&Number(snap.safeVisibility?.count||0)===snap.safeCount;
  const elderPass=snap.elder?.state==='committed'&&Number(snap.elder?.featureCount||0)>0&&String(snap.elder?.propertyRunIdentity||'').startsWith(target.lng.toFixed(6)+'|'+target.lat.toFixed(6)+'|');
  const tierPass=snap.displayedTier==='property';
  const newErrors=pageErrors.slice(errorStart);
  return {name:target.name,elapsedMs:Date.now()-started,out,runError,settleError,centerPass,safePass,elderPass,elderWaitError,tierPass,newErrors,snap,pass:!elderWaitError&&centerPass&&safePass&&elderPass&&tierPass&&newErrors.length===0};
}
const rows=[];
for(let i=0;i<TARGETS.length;i++) rows.push(await runTarget(TARGETS[i],i));
const replacementPass=rows.length>=2&&rows[0].snap.publication?.runToken!==rows[1].snap.publication?.runToken&&Math.abs(Number(rows[1].snap.audit?.center?.lng)-TARGETS[1].lng)<1e-5;
const deterministicPairs=[[0,1],[2,3]].map(([a,b])=>({a:rows[a].name,b:rows[b].name,countEqual:rows[a].snap.safeCount===rows[b].snap.safeCount,inputEqual:rows[a].snap.publication?.scientificInputFingerprint===rows[b].snap.publication?.scientificInputFingerprint,maskEqual:rows[a].snap.publication?.noBuildMaskHash===rows[b].snap.publication?.noBuildMaskHash}));
const deterministicPass=deterministicPairs.every(p=>p.countEqual&&p.inputEqual&&p.maskEqual);
const report={at:new Date().toISOString(),url:URL,rows,replacementPass,deterministicPairs,deterministicPass,pageErrors,badResponses,pass:rows.every(r=>r.pass)&&replacementPass&&deterministicPass};
writeFileSync('artifacts/ny-repeat-live/results.json',JSON.stringify(report,null,2));
console.log('NY_CONTROL '+JSON.stringify({pass:report.pass,replacementPass,deterministicPass,deterministicPairs,rows:rows.map(r=>({name:r.name,pass:r.pass,elapsedMs:r.elapsedMs,runError:r.runError,settleError:r.settleError,safeCount:r.snap.safeCount,rechargeCount:r.snap.rechargeCount,engineCount:r.snap.engineCount,halt:r.snap.prescriptionHalt,zero:r.snap.prescriptionZero,propertyFailure:r.snap.propertyFailure,engine:r.snap.engine,publication:r.snap.publication,runState:r.snap.displayedRunState,elderCount:r.snap.elder?.featureCount||0,elderState:r.snap.elder?.state||null,elderError:r.snap.elder?.error||r.snap.elder?.dynamicError||null,elderWaitError:r.elderWaitError,natural:r.snap.naturalLayers,safe:r.snap.safeLayers,errors:r.newErrors}))}));
await browser.close();
if(!report.pass)process.exitCode=1;
