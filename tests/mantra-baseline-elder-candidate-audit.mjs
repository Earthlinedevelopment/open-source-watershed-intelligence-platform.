import {chromium} from 'playwright';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/candidate-mantra84/';
const TARGETS=[
  {name:'control-1',lng:-111.93066,lat:34.21568},
  {name:'control-2',lng:-111.93456,lat:34.21545}
];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:950}});
const pageErrors=[],badResponses=[];
const stagedElder=readFileSync('earthline-elder-restored-17097.js');
await page.route('**/earthline-elder-restored-17097.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:stagedElder}));
const stagedLaunch=readFileSync('earthline-launch-16872.js');
await page.route('**/earthline-launch-16872.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:stagedLaunch}));
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')pageErrors.push(m.text())});
page.on('response',r=>{if(r.status()>=400)badResponses.push({status:r.status(),url:r.url()})});
mkdirSync('artifacts/arizona-controls',{recursive:true});

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
writeFileSync('artifacts/arizona-controls/regional-diagnostic.json',JSON.stringify({regionalTimeout,regionalDiagnostic,pageErrors,badResponses},null,2));
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
  // Use the actual visible 20-acre button, not an internal function: first-press acceptance.
  await page.locator('#earthlineDeclareProperty16169').click({timeout:20000});
  const out='one-visible-button-press';
  await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return a.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';},null,{timeout:45000,polling:120});
  // Elder CHMv2 worker is separate from property publication. Await matching terminal result.
  let elderWaitError=null;
  try{await page.waitForFunction(()=>{
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
    const current=window.EARTHLINE_PROPERTY_DECLARATION_16169?.center||null;
    if(!current)return false;
    const identity=Number(current.lng).toFixed(6)+'|'+Number(current.lat).toFixed(6)+'|';
    return String(e.propertyRunIdentity||'').startsWith(identity)&&['committed','failed'].includes(e.state);
  },null,{timeout:20000,polling:200});}catch(e){elderWaitError=String(e);}

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
  await page.screenshot({path:`artifacts/arizona-controls/az-${index+1}.png`,fullPage:false});
  const centerPass=Math.abs(Number(snap.audit?.center?.lng)-target.lng)<1e-5&&Math.abs(Number(snap.audit?.center?.lat)-target.lat)<1e-5;
  const safePass=snap.audit?.settled===true&&snap.audit?.result===true&&snap.publication?.published===true&&snap.safeCount>0&&snap.safeVisibility?.visible===true&&Number(snap.safeVisibility?.count||0)===snap.safeCount;
  const elderPass=snap.elder?.state==='committed'&&Number(snap.elder?.featureCount||0)>0&&String(snap.elder?.propertyRunIdentity||'').startsWith(target.lng.toFixed(6)+'|'+target.lat.toFixed(6)+'|');
  const tierPass=snap.displayedTier==='property';
  const probe=await page.evaluate(()=>{
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const tree=window.EARTHLINE_ELDER_TREES_V1_17097,features=tree?.features?.()||[];
    const ids=['earthline-property-safe-water-16221','earthline-property-safe-life-16221','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-casing-16174'];
    const paint=ids.map(id=>{
      const layer=map?.getLayer?.(id),keys=['line-color','line-opacity','line-width','line-offset','line-dasharray'];
      return {id,type:layer?.type||'missing',properties:Object.fromEntries(keys.map(k=>{let v=null;try{v=map?.getPaintProperty?.(id,k)??null}catch(_){}return [k,v]}))};
    });
    const safe=(typeof M!=='undefined'?M:null)?.authoritativeSafeSwales15815?.features||[];
    const slopes=safe.map(f=>f.properties||{});
    const sampleSlopeKeys=slopes.slice(0,3).map(p=>Object.fromEntries(Object.entries(p).filter(([k])=>/slope|gradient|grade/i.test(k))));
    const slopeValues=slopes.flatMap(p=>Object.entries(p).filter(([k,v])=>/slope_pct|slope_percent|max_slope_pct/i.test(k)&&Number.isFinite(Number(v))).map(([,v])=>Number(v)));

    const pts=features.map(f=>{const coords=f.geometry?.coordinates;let pt=null;try{pt=map?.project?.(coords);}catch(_){}return {coords,point:pt&&{x:pt.x,y:pt.y}}});
    return {count:features.length,paint,pts,safeCount:safe.length,trackedSlopeValues:slopeValues.length,maxTrackedSlope:slopeValues.length?Math.max(...slopeValues):null,sampleSlopeKeys};
  });
  console.log('ELDER_STAGING_LAYER_AUDIT '+JSON.stringify({target:target.name,probe,elderWaitError,actualCenter:snap.audit?.center,actualTarget:await page.evaluate(()=>window.EARTHLINE_PROPERTY_TARGET_16201),publicationToken:snap.publication?.runToken,elderIdentity:snap.elder?.propertyRunIdentity,blueAudit:await page.evaluate(()=>window.EARTHLINE_BLUE_SWALES_AUDIT_17501||null),launchAudit:await page.evaluate(()=>window.EARTHLINE_PROPERTY_LAUNCH_AUDIT_16322?.slice(-8)||[]),buttonState:await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return {onclick:String(b?.onclick||'').slice(0,250),disabled:!!b?.disabled,busy:b?.dataset?.busy,terminal:b?.dataset?.terminalRunning,state:document.documentElement.dataset.earthlinePropertyRunState}})}));
  let hover=false,click=false;
  for(const rec of probe.pts){
    const pt=rec.point;
    if(!pt||pt.x<20||pt.y<20||pt.x>1550||pt.y>900)continue;
    const rect=await page.locator('.mapboxgl-canvas').first().boundingBox();
    if(!rect)break;
    await page.mouse.move(rect.x+pt.x,rect.y+pt.y);
    await page.waitForTimeout(500);
    hover=await page.locator('.earthline-elder-hover-m7').filter({hasText:'ELDER TREE RESEARCH'}).count()>0;
    await page.mouse.click(rect.x+pt.x,rect.y+pt.y);
    await page.waitForTimeout(400);
    click=await page.locator('.mapboxgl-popup').filter({hasText:'Elder Tree Confidence'}).count()>0;
    if(hover&&click)break;
  }
  console.log('ELDER_STAGING_INTERACTION '+JSON.stringify({target:target.name,hover,click}));
  const newErrors=pageErrors.slice(errorStart);
  return {name:target.name,elapsedMs:Date.now()-started,out,centerPass,safePass,elderPass,elderWaitError,tierPass,newErrors,snap,probe,hover,click,pass:!elderWaitError&&centerPass&&safePass&&elderPass&&tierPass&&hover&&click&&newErrors.length===0};
}
const rows=[];
for(let i=0;i<TARGETS.length;i++) rows.push(await runTarget(TARGETS[i],i));
const replacementPass=rows.length===2&&rows[0].snap.publication?.runToken!==rows[1].snap.publication?.runToken&&Math.abs(Number(rows[1].snap.audit?.center?.lng)-TARGETS[1].lng)<1e-5;
const report={at:new Date().toISOString(),url:URL,rows,replacementPass,pageErrors,badResponses,pass:rows.every(r=>r.pass)&&replacementPass};
writeFileSync('artifacts/arizona-controls/results.json',JSON.stringify(report,null,2));
console.log('ARIZONA_CONTROL '+JSON.stringify({pass:report.pass,replacementPass,rows:rows.map(r=>({name:r.name,pass:r.pass,elapsedMs:r.elapsedMs,safeCount:r.snap.safeCount,elderCount:r.snap.elder?.featureCount||0,hover:r.hover,click:r.click,elderWaitError:r.elderWaitError,natural:r.snap.naturalLayers,safe:r.snap.safeLayers,errors:r.newErrors}))}));
await browser.close();
if(!report.pass)process.exitCode=1;
