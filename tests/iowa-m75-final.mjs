import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL;
if(!URL) throw new Error('EARTHLINE_URL required');
const TARGET={lat:41.95715,lng:-93.38977};
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('https://api.mapbox.com/**',async route=>{
  const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
  await route.continue({headers});
});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await page.goto(URL+'?m75-iowa-final='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});

const input=page.locator('#searchInput');
await input.fill('Iowa');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(200);
const regionalStart=Date.now();
await page.locator('#runBtn').click({force:true});
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  return String(d&&(d.tier||d.mode)||'').toLowerCase()==='regional' &&
    document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
},null,{timeout:120000,polling:250});
await page.waitForTimeout(1200);
const regional=await page.evaluate(()=>({
  displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
  displayAudit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
  publicationView:window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337||null
}));
regional.elapsedMs=Date.now()-regionalStart;
await page.screenshot({path:'iowa-regional-initial.png',fullPage:false});

if(!regional.displayAudit) throw new Error('Regional display audit missing');
if(Number(regional.displayAudit.generatedSwales||0)<=0) throw new Error('Regional generated swales missing');
if(Number(regional.displayAudit.swaleLines||0)!==0) throw new Error('Initial Regional worms still visible: '+regional.displayAudit.swaleLines);
if(regional.displayAudit.corridorGeometryVisible!==false) throw new Error('Initial Regional corridor geometry not suppressed');
if(Number(regional.displayAudit.waterPaths||0)<=0) throw new Error('Regional water paths missing');

await page.evaluate(({lat,lng})=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(typeof M!=='undefined'&&M){
    M.centerLat=lat; M.centerLng=lng;
    M.loc=Object.assign({},M.loc||{},{name:'Iowa diagnostic',lat,lng,countryCode:'us',query:'Iowa'});
  }
  try{mp?.jumpTo?.({center:[lng,lat],zoom:13});}catch(_){}
},TARGET);
await page.waitForTimeout(900);

const pStart=Date.now();
const btn=page.locator('#earthlineDeclareProperty16169');
if(await btn.count()) await btn.click({force:true});
else await page.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16173?.());
await page.waitForFunction(()=>{
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  return a?.settled===true && a?.renderVerified===true;
},null,{timeout:120000,polling:200});

async function sample(label){
  return await page.evaluate(({label})=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const m=(typeof M!=='undefined'?M:null);
    const ids=[
      'earthline-property-safe-casing-16221','earthline-property-safe-earth-16221',
      'earthline-property-safe-life-16221','earthline-property-safe-water-16221',
      'earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174',
      'earthline-property-swale-neutral-16177','earthline-property-swale-natural-up-16174',
      'earthline-property-swale-natural-flip-16174','earthline-swale-planting-layer-15806',
      'earthline-swale-planting-shadow-15806','earthline-property-swale-canopy-16166',
      'earthline-property-swale-ditch-16166'
    ];
    const rendered={},opacity={},visible={};
    const c=mp?.getCanvas?.(),box=c&&[[0,0],[c.clientWidth||c.width,c.clientHeight||c.height]];
    for(const id of ids){
      try{
        const exists=!!mp?.getLayer?.(id);
        visible[id]=exists?(mp.getLayoutProperty(id,'visibility')||'visible'):null;
        opacity[id]=exists?mp.getPaintProperty(id,id.includes('planting')?'circle-opacity':(id.includes('footprint')?'fill-opacity':'line-opacity')):null;
        rendered[id]=(exists&&box&&visible[id]!=='none')?(mp.queryRenderedFeatures(box,{layers:[id]})||[]).length:0;
      }catch(_){rendered[id]=0;}
    }
    const safeRendered=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'].reduce((n,id)=>n+(rendered[id]||0),0);
    const sourceCounts={};
    for(const id of ['earthline-property-safe-16221','earthline-property-swale-texture-16174','earthline-living-swales-15792','earthline-property-flow-15792']){
      try{
        const src=mp?.getSource?.(id),d=src&&(src._data||src._options?.data);
        sourceCounts[id]=d&&Array.isArray(d.features)?d.features.length:null;
      }catch(_){sourceCounts[id]=null}
    }
    const styleLayers=(mp?.getStyle?.()?.layers||[]).filter(l=>/satellite|raster|imagery|mapbox-satellite|aerial/i.test(String(l.id||'')+' '+String(l.source||''))).map(l=>({
      id:l.id,type:l.type,source:l.source,
      visibility:(()=>{try{return mp.getLayoutProperty(l.id,'visibility')||'visible'}catch(_){return null}})(),
      rasterOpacity:(()=>{try{return l.type==='raster'?mp.getPaintProperty(l.id,'raster-opacity'):null}catch(_){return null}})()
    }));
    const base=document.getElementById('mapboxBase'),cv=document.getElementById('map');
    const surface={
      mapLoaded:!!mp?.loaded?.(),tilesLoaded:typeof mp?.areTilesLoaded==='function'?!!mp.areTilesLoaded():null,
      mapCanvasVisibility:mp?.getCanvas?.()?getComputedStyle(mp.getCanvas()).visibility:null,
      mapCanvasOpacity:mp?.getCanvas?.()?getComputedStyle(mp.getCanvas()).opacity:null,
      mapboxBaseVisibility:base?getComputedStyle(base).visibility:null,
      mapboxBaseOpacity:base?getComputedStyle(base).opacity:null,
      analysisCanvasVisibility:cv?getComputedStyle(cv).visibility:null,
      analysisCanvasOpacity:cv?getComputedStyle(cv).opacity:null,
      analysisCanvasZ:cv?getComputedStyle(cv).zIndex:null,
      mapboxZ:base?getComputedStyle(base).zIndex:null,
      analyticalValid:window.earthlineAnalyticalCanvasValid15783,
      propertyCanvasValid:window.earthlinePropertyCanvasValid15782,
      styleLayers
    };
    const naturalRendered=['earthline-property-swale-natural-casing-16174','earthline-property-swale-neutral-16177','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174'].reduce((n,id)=>n+(rendered[id]||0),0);
    const plantingRendered=(rendered['earthline-swale-planting-layer-15806']||0)+(rendered['earthline-swale-planting-shadow-15806']||0);
    return {
      label,
      propertyAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      authoritativeCount:Number(m?.authoritativeSafeSwales15815?.features?.length||0),
      safeRendered,naturalRendered,plantingRendered,rendered,opacity,visible,
      textureAudit:window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169||null,
      safeVisibilityAudit:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
      sourceCounts,surface,
      plantingAudit:window.EARTHLINE_NATURAL_SWALE_PLANTING_AUDIT_15806||window.EARTHLINE_NATURAL_SWALE_AUDIT_15806||null,
      tier:document.documentElement.dataset.earthlineAnalysisTier||null,
      runState:document.documentElement.dataset.earthlinePropertyRunState||null
    };
  },{label});
}
const settle=await sample('settle');
await page.screenshot({path:'iowa-property-settle.png',fullPage:false});
await page.waitForTimeout(5000);
const five=await sample('plus5s');
await page.screenshot({path:'iowa-property-plus5s.png',fullPage:false});

const out={regional,propertyElapsedMs:Date.now()-pStart,settle,five,errors};
fs.writeFileSync('iowa-m75-final.json',JSON.stringify(out,null,2));
console.log('EARTHLINE_M75_DIAG '+JSON.stringify({
  settle:{authoritativeCount:settle.authoritativeCount,safeRendered:settle.safeRendered,naturalRendered:settle.naturalRendered,plantingRendered:settle.plantingRendered,sourceCounts:settle.sourceCounts,safeVisibilityAudit:settle.safeVisibilityAudit,surface:settle.surface,opacity:settle.opacity,visible:settle.visible},
  five:{authoritativeCount:five.authoritativeCount,safeRendered:five.safeRendered,naturalRendered:five.naturalRendered,plantingRendered:five.plantingRendered,sourceCounts:five.sourceCounts,safeVisibilityAudit:five.safeVisibilityAudit,surface:five.surface,opacity:five.opacity,visible:five.visible}
}));
for(const s of [settle,five]){
  if(s.authoritativeCount<=0) throw new Error(s.label+' authoritative swales missing');
  if((s.safeRendered+s.naturalRendered)<=0) throw new Error(s.label+' no Property swale geometry rendered');
}
if(settle.plantingRendered>0 && five.plantingRendered===0) throw new Error('Property planting blinked out after settlement');
console.log('EARTHLINE_M75_FINAL '+JSON.stringify({
  regional:{elapsedMs:regional.elapsedMs,generatedSwales:regional.displayAudit.generatedSwales,swaleLines:regional.displayAudit.swaleLines,waterPaths:regional.displayAudit.waterPaths,corridorGeometryVisible:regional.displayAudit.corridorGeometryVisible},
  propertyElapsedMs:out.propertyElapsedMs,
  settle:{authoritativeCount:settle.authoritativeCount,safeRendered:settle.safeRendered,naturalRendered:settle.naturalRendered,plantingRendered:settle.plantingRendered,renderMode:settle.propertyAudit?.renderMode,renderVerified:settle.propertyAudit?.renderVerified},
  five:{authoritativeCount:five.authoritativeCount,safeRendered:five.safeRendered,naturalRendered:five.naturalRendered,plantingRendered:five.plantingRendered,renderMode:five.propertyAudit?.renderMode,renderVerified:five.propertyAudit?.renderVerified},
  errors
}));
await browser.close();