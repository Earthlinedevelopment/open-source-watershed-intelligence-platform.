import {chromium} from 'playwright';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';

const URL='https://earthlinedevelopment.org/';
const M92_HTML=readFileSync('artifacts/property-coherent/index.html','utf8');
const TARGETS=[
  {name:'control-1',lng:-111.93066,lat:34.21568},
  {name:'control-2',lng:-111.93456,lat:34.21545}
];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:950}});
const pageErrors=[],badResponses=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')pageErrors.push(m.text())});
page.on('response',r=>{if(r.status()>=400)badResponses.push({status:r.status(),url:r.url()})});
mkdirSync('artifacts/property-coherent-e2e',{recursive:true});

await page.route('**/*',async route=>{
  const req=route.request();
  if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(URL))
    return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:M92_HTML});
  return route.continue();
});
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
writeFileSync('artifacts/property-coherent-e2e/regional-diagnostic.json',JSON.stringify({regionalTimeout,regionalDiagnostic,pageErrors,badResponses},null,2));
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
      swaleMeta:md?.swaleMeta||null,
      textureAudit:window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169||null,
      authoritativeFC:md?.authoritativeSafeSwales15815?.features?.map(f=>({geometry:f.geometry,props:f.properties}))||[],
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
  await page.screenshot({path:`artifacts/property-coherent-e2e/az-${index+1}.png`,fullPage:false});
  const centerPass=Math.abs(Number(snap.audit?.center?.lng)-target.lng)<1e-5&&Math.abs(Number(snap.audit?.center?.lat)-target.lat)<1e-5;
  const safePass=snap.audit?.settled===true&&snap.audit?.result===true&&snap.publication?.published===true&&snap.safeCount>0&&snap.safeVisibility?.visible===true&&Number(snap.safeVisibility?.count||0)===snap.safeCount;
  const elderPass=snap.elder?.state==='committed'&&Number(snap.elder?.featureCount||0)>0&&String(snap.elder?.propertyRunIdentity||'').startsWith(target.lng.toFixed(6)+'|'+target.lat.toFixed(6)+'|');
  const tierPass=snap.displayedTier==='property';
  const newErrors=pageErrors.slice(errorStart);
  return {name:target.name,elapsedMs:Date.now()-started,out,centerPass,safePass,elderPass,tierPass,newErrors,snap,pass:centerPass&&safePass&&elderPass&&tierPass&&newErrors.length===0};
}
const rows=[];
for(let i=0;i<TARGETS.length;i++) rows.push(await runTarget(TARGETS[i],i));
const propertyTruth=rows.map(r=>{
 const snap=r.snap,tx=snap.textureAudit||{},pub=snap.publication||{};
 const f=snap.authoritativeFC||[];
 const notes=[];
 if(snap.swaleMeta?.constructionReady!==false)notes.push('false construction-ready');
 if(snap.safeCount!==f.length||snap.safeCount!==Number(pub.publicationCount||0))
   notes.push('published vs authoritative mismatch');
 if(snap.safeCount<1||snap.safeCount!==Number(snap.safeVisibility?.count||0))
   notes.push('safe layer not delivered');
 if(tx.propertyActive&&tx.centerlines>snap.safeCount)notes.push('stale natural texture count');
 if(/Property detail published/.test(snap.status||'')&&
   !snap.status.includes('Limited opportunity')&&snap.safeCount<=3)
   notes.push('missing sparse result explanation');
 if(/(construction.ready|safe for construction)/i.test(snap.status||''))
   notes.push('false construction claim');
 return {name:r.name,safeCount:snap.safeCount,constructionReady:snap.swaleMeta?.constructionReady,
   published:pub.publicationCount,status:snap.status,texture:tx.centerlines,notes};
});
console.log('M92_PROPERTY_COHERENCE '+JSON.stringify(propertyTruth));
const regionButtonBefore=await page.evaluate(()=>({
  disabled:document.getElementById('runBtn')?.disabled||false,
  label:document.getElementById('runBtn')?.textContent?.trim()||null,
  tier:document.documentElement.dataset.earthlineAnalysisTier
}));
console.log('M92_BEFORE_REGION_RETURN '+JSON.stringify(regionButtonBefore));
const preReentryM92=await page.evaluate(()=>({shownTier:document.documentElement.dataset.earthlineAnalysisTier,display:window.EARTHLINE_DISPLAYED_RUN_16151?.tier||null,token:window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||null,ledger:window.EARTHLINE_RUN_LEDGER_16147?.slice(-4)||[],lastNav:window.EARTHLINE_TIER_NAV_LAST_ACTION_16156||null,cache:window.EARTHLINE_REGIONAL_CACHE_16157?.snapshot?.runToken||null}));
console.log('M92_PRE_REENTRY_TRACE '+JSON.stringify(preReentryM92));
const tokenBefore=await page.evaluate(()=>window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||null);
let regionReentry=false,regionReentryError=null;
try{
 await page.evaluate(()=>{
   const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
   i.value='Arizona';i.dispatchEvent(new Event('input',{bubbles:true}));
   i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
 });
 await page.waitForFunction(old=>{
    const t=window.EARTHLINE_REGIONAL_TERMINAL_16539||{};
    const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{};
    const n=document.getElementById('earthlineTierNotice16173');
    return t.status==='published'&&t.runToken&&t.runToken!==old&&
      document.documentElement.dataset.earthlineAnalysisTier==='regional'&&
      window.EARTHLINE_PROPERTY_TARGET_16201==null&&n?.dataset.mode!=='property'&&
      p.runToken===t.runToken;
 },tokenBefore,{timeout:55000,polling:250});
 regionReentry=true;
}catch(e){regionReentryError=String(e)}
const traceM92=await page.evaluate(()=>({ledger:window.EARTHLINE_RUN_LEDGER_16147?.slice(-16)||[],lastNav:window.EARTHLINE_TIER_NAV_LAST_ACTION_16156||null,cache:window.EARTHLINE_REGIONAL_CACHE_16157?.snapshot?.runToken||null,display:window.EARTHLINE_DISPLAYED_RUN_16151||null,regionalState:window.earthlineRegional15778?{active:window.earthlineRegional15778.active,mode:window.earthlineRegional15778.mode}:null,map:(()=>{try{const m=window.earthlineMap||earthlineMap;return {zoom:m.getZoom(),center:m.getCenter().toArray()}}catch{return null}})(),isDisabled:document.getElementById('runBtn')?.disabled,propertyTarget:window.EARTHLINE_PROPERTY_TARGET_16201||null,tierNotice:document.getElementById('earthlineTierNotice16173')?.textContent||null}));
console.log('M92_POST_REENTRY_TRACE '+JSON.stringify(traceM92));
const reentryState=await page.evaluate(()=>({
  tier:document.documentElement.dataset.earthlineAnalysisTier,
  search:document.getElementById('searchInput')?.value||null,
  runDisabled:document.getElementById('runBtn')?.disabled,
  runLabel:document.getElementById('runBtn')?.textContent?.trim()?.slice(0,100),
  regionalRunToken:window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||null,
  regionalCoreMs:window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.phaseTotalsMs?.coreTotalMs,
  regionalProfile:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556?.profileId||null,
  sourceCount:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated||null,
  regionError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
  regionTerminal:window.EARTHLINE_REGIONAL_TERMINAL_16539||null,
  propertyTarget:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  chosenLocation:window.EARTHLINE_CHOSEN_LOCATION_16189||null,
  propertyRunState:document.documentElement.dataset.earthlinePropertyRunState||null,
  panelTier:document.getElementById('earthlineTierNotice16173')?.textContent||null,
  mapName:typeof M!=='undefined'?M.loc?.name||null:null,
  searchGen:typeof M!=='undefined'?M.searchGen:null
}));
console.log('M92_REGION_REENTRY_STATE '+JSON.stringify(reentryState));
console.log('M92_REGION_REENTRY '+JSON.stringify({regionReentry,regionReentryError}));

const replacementPass=rows.length===2&&rows[0].snap.publication?.runToken!==rows[1].snap.publication?.runToken&&Math.abs(Number(rows[1].snap.audit?.center?.lng)-TARGETS[1].lng)<1e-5;
const report={at:new Date().toISOString(),url:URL,rows,replacementPass,
 regionReentry,regionReentryError,propertyTruth,pageErrors,badResponses,
 pass:rows.every(r=>r.pass)&&replacementPass&&regionReentry&&propertyTruth.every(p=>p.notes.length===0)};
writeFileSync('artifacts/property-coherent-e2e/results.json',JSON.stringify(report,null,2));
console.log('M92_PROPERTY_E2E '+JSON.stringify({pass:report.pass,replacementPass,rows:rows.map(r=>({name:r.name,pass:r.pass,elapsedMs:r.elapsedMs,safeCount:r.snap.safeCount,elderCount:r.snap.elder?.featureCount||0,natural:r.snap.naturalLayers,safe:r.snap.safeLayers,errors:r.newErrors}))}));
await browser.close();
if(!report.pass)process.exitCode=1;
