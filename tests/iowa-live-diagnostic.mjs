import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const URL=BASE+(BASE.includes('?')?'&':'?')+'iowa-live-diagnostic='+Date.now();
const TARGET={lat:41.95715,lng:-93.38977};
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('https://api.mapbox.com/**',async route=>{
  const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
  await route.continue({headers});
});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
const started=Date.now();

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});

const input=page.locator('#searchInput');
await input.fill('Iowa');
await page.waitForTimeout(800);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(150);
await page.locator('#runBtn').click({force:true});
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const tier=String(d&&(d.tier||d.mode)||'').toLowerCase();
  return tier==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
},null,{timeout:90000,polling:150});

await page.evaluate(({lat,lng})=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(typeof M!=='undefined'&&M){
    M.centerLat=lat; M.centerLng=lng;
    M.loc=Object.assign({},M.loc||{},{name:'Iowa diagnostic',countryCode:'us',placeType:'state',lat,lng,query:'Iowa'});
  }
  try{mp?.jumpTo?.({center:[lng,lat],zoom:13});}catch(_){}
},{...TARGET});
await page.waitForTimeout(1200);

const pre=await page.evaluate(()=>({
  button:!!document.getElementById('earthlineDeclareProperty16169'),
  disabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,
  buttonText:document.getElementById('earthlineDeclareProperty16169')?.textContent||'',
  center:(window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null))?.getCenter?.(),
  runState:document.documentElement.dataset.earthlinePropertyRunState||'',
  hasDeclare:typeof window.earthlineDeclarePropertyAtCrosshair16173==='function'
}));

const propertyStarted=Date.now();
const serialBefore=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
if(!pre.disabled && pre.button){
  await page.locator('#earthlineDeclareProperty16169').click({force:true});
}else if(pre.hasDeclare){
  await page.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16173());
}else{
  throw new Error('Property declaration unavailable '+JSON.stringify(pre));
}

let settled=false;
try{
  await page.waitForFunction(()=>{
    const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const state=String(document.documentElement.dataset.earthlinePropertyRunState||'').toLowerCase();
    return audit?.settled===true || (state && state!=='running');
  },null,{timeout:90000,polling:200});
  settled=true;
}catch(_){}

const renderReadyProbeStarted=Date.now();
let firstRenderedPropertyMs=null;
for(let i=0;i<80;i++){
  const n=await page.evaluate(()=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const ids=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'];
    try{
      const cv=mp?.getCanvas?.(),box=cv&&[[0,0],[cv.clientWidth||cv.width,cv.clientHeight||cv.height]];
      return box?(mp.queryRenderedFeatures?.(box,{layers:ids.filter(id=>{try{return !!mp.getLayer(id)}catch(_){return false}})})||[]).length:0;
    }catch(_){return 0}
  });
  if(n>0){firstRenderedPropertyMs=Date.now()-renderReadyProbeStarted;break}
  await page.waitForTimeout(50);
}
await page.waitForTimeout(100);

const diag=await page.evaluate(({target,serialBefore,pre,started,propertyStarted,settled})=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const style=mp?.getStyle?.()||{};
  const layers=(style.layers||[]).filter(l=>/swale|contour|safe/i.test(String(l.id||''))).map(l=>({
    id:l.id,type:l.type,source:l.source,sourceLayer:l['source-layer']||null,
    visibility:(()=>{try{return mp.getLayoutProperty(l.id,'visibility')||'visible'}catch(_){return null}})()
  }));
  const safeLayerIds=layers.filter(l=>/safe|swale/i.test(l.id)&&l.type==='line'&&l.visibility!=='none').map(l=>l.id);
  let feats=[];
  try{
    const c=mp?.getCanvas?.();
    const box=c&&[[0,0],[c.clientWidth||c.width,c.clientHeight||c.height]];
    if(box&&safeLayerIds.length) feats=mp.queryRenderedFeatures(box,{layers:safeLayerIds})||[];
  }catch(_){}
  const seen=new Set(), lines=[];
  function flattenGeom(g){
    if(!g)return[];
    if(g.type==='LineString')return [g.coordinates];
    if(g.type==='MultiLineString')return g.coordinates||[];
    return[];
  }
  for(const f of feats){
    for(const coords of flattenGeom(f.geometry)){
      const key=JSON.stringify(coords);
      if(seen.has(key))continue; seen.add(key);
      const picks=[];
      if(coords.length){
        const idx=[0,Math.floor((coords.length-1)*0.25),Math.floor((coords.length-1)*0.5),Math.floor((coords.length-1)*0.75),coords.length-1];
        for(const i of [...new Set(idx)]){
          const p=coords[i]; let z=null;
          try{z=mp?.queryTerrainElevation?.({lng:p[0],lat:p[1]},{exaggerated:false});}catch(_){}
          picks.push({lng:p[0],lat:p[1],z:Number.isFinite(z)?z:null});
        }
      }
      const zs=picks.map(p=>p.z).filter(Number.isFinite);
      lines.push({
        layer:f.layer?.id||null,
        props:f.properties||{},
        points:coords.length,
        start:coords[0]||null,end:coords[coords.length-1]||null,
        elevationSamples:picks,
        elevationRange:zs.length?Math.max(...zs)-Math.min(...zs):null,
        endpointDelta:zs.length>1?Math.abs(zs[zs.length-1]-zs[0]):null
      });
      if(lines.length>=40)break;
    }
    if(lines.length>=40)break;
  }
  const contourAudit={swaleDiagnostics:null,swaleMeta:null,rawCount:0,rows:[],summary:null};
  try{
    if(typeof M!=='undefined'&&M){
      contourAudit.swaleDiagnostics=M.swaleDiagnostics?JSON.parse(JSON.stringify(M.swaleDiagnostics)):null;
      contourAudit.swaleMeta=M.swaleMeta?JSON.parse(JSON.stringify(M.swaleMeta)):null;
      const fc=M.authoritativeSafeSwales15815||M.authoritativeSafeSwales15806||null;
      const features=Array.isArray(fc?.features)?fc.features:[];
      contourAudit.rawCount=features.length;
      const sampleH=(lng,lat)=>{
        if(typeof earthlineLngLatToGrid!=='function'||!M.h)return null;
        const g=earthlineLngLatToGrid(Number(lng),Number(lat)),x=g[0],y=g[1];
        if(!Number.isFinite(x)||!Number.isFinite(y))return null;
        const x0=Math.max(0,Math.min(GW-1,Math.floor(x))),y0=Math.max(0,Math.min(GH-1,Math.floor(y)));
        const x1=Math.max(0,Math.min(GW-1,x0+1)),y1=Math.max(0,Math.min(GH-1,y0+1));
        const tx=Math.max(0,Math.min(1,x-x0)),ty=Math.max(0,Math.min(1,y-y0));
        const q=[M.h[idx(x0,y0)],M.h[idx(x1,y0)],M.h[idx(x0,y1)],M.h[idx(x1,y1)]].map(Number);
        if(!q.every(Number.isFinite))return null;
        return q[0]*(1-tx)*(1-ty)+q[1]*tx*(1-ty)+q[2]*(1-tx)*ty+q[3]*tx*ty;
      };
      const geoms=[];
      for(const f of features){
        const g=f?.geometry;
        const groups=g?.type==='LineString'?[g.coordinates]:(g?.type==='MultiLineString'?g.coordinates:[]);
        for(const coords of groups||[]){
          if(!Array.isArray(coords)||coords.length<2)continue;
          const zs=coords.map(p=>sampleH(p[0],p[1])).filter(Number.isFinite);
          if(zs.length<2)continue;
          const range=Math.max(...zs)-Math.min(...zs);
          const endDelta=Math.abs(zs[zs.length-1]-zs[0]);
          geoms.push({id:f?.properties?.id||f?.id||null,score:Number(f?.properties?.score)||null,points:coords.length,elevationRangeM:range,endpointDeltaM:endDelta});
        }
      }
      contourAudit.rows=geoms;
      const ranges=geoms.map(x=>x.elevationRangeM).filter(Number.isFinite).sort((a,b)=>a-b);
      const ends=geoms.map(x=>x.endpointDeltaM).filter(Number.isFinite).sort((a,b)=>a-b);
      const pct=(a,p)=>a.length?a[Math.min(a.length-1,Math.floor((a.length-1)*p))]:null;
      contourAudit.summary={
        lines:geoms.length,
        medianElevationRangeM:pct(ranges,.5),
        p90ElevationRangeM:pct(ranges,.9),
        maxElevationRangeM:ranges.length?ranges[ranges.length-1]:null,
        medianEndpointDeltaM:pct(ends,.5),
        p90EndpointDeltaM:pct(ends,.9),
        maxEndpointDeltaM:ends.length?ends[ends.length-1]:null,
        over025m:ranges.filter(v=>v>.25).length,
        over050m:ranges.filter(v=>v>.50).length,
        over100m:ranges.filter(v=>v>1).length
      };
    }
  }catch(e){contourAudit.error=String(e?.message||e)}

  const mSummary={};
  try{
    if(typeof M!=='undefined'&&M){
      for(const k of Object.keys(M).filter(k=>/swale|contour|dem|slope|forest|tree|terrain|phase|timing/i.test(k)).slice(0,120)){
        const v=M[k];
        if(Array.isArray(v))mSummary[k]={type:'array',length:v.length};
        else if(v&&typeof v==='object')mSummary[k]={type:'object',keys:Object.keys(v).slice(0,40)};
        else mSummary[k]={type:typeof v,value:(typeof v==='string'||typeof v==='number'||typeof v==='boolean')?v:null};
      }
    }
  }catch(_){}
  return {
    target,pre,serialBefore,
    serialAfter:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
    elapsedMs:Date.now()-started,propertyElapsedMs:Date.now()-propertyStarted,settled,
    runState:document.documentElement.dataset.earthlinePropertyRunState||'',
    runAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    phaseTrace:window.EARTHLINE_PROPERTY_PHASE_TRACE_16319||null,
    publicationAudit:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
    safetyDiag:window.EARTHLINE_SAFETY_LOCK_DIAG_17695||null,
    clearance:window.EARTHLINE_PROPERTY_CLEARANCE_AUDIT_17696||null,
    layers,safeLayerIds,featureCount:feats.length,uniqueLines:lines,
    contourAudit,
    uiState:{
      htmlRunning:document.documentElement.classList.contains('earthline-property-running-16233'),
      runState:document.documentElement.dataset.earthlinePropertyRunState||'',
      declareBusy:document.getElementById('earthlineDeclareProperty16169')?.getAttribute('aria-busy')||null,
      declareTerminalRunning:document.getElementById('earthlineDeclareProperty16169')?.getAttribute('data-terminal-running')||null,
      statusText:document.getElementById('status')?.textContent||document.querySelector('[data-earthline-status]')?.textContent||''
    },
    rendererOwnership:(()=>{try{
      const mp2=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      const style2=mp2?.getStyle?.()||{};
      const regionalIds=(style2.layers||[]).map(l=>l.id).filter(id=>/regional|swale.*16020|corridor.*16149/i.test(String(id||'')));
      const propertyIds=(style2.layers||[]).map(l=>l.id).filter(id=>/earthline-property-safe-|property.*swale|swale.*property/i.test(String(id||'')));
      const vis=id=>{try{return mp2.getLayoutProperty(id,'visibility')||'visible'}catch(_){return null}};
      const rendered=ids=>{try{const cv=mp2.getCanvas?.(),box=cv&&[[0,0],[cv.clientWidth||cv.width,cv.clientHeight||cv.height]];return box&&ids.length?(mp2.queryRenderedFeatures?.(box,{layers:ids.filter(id=>{try{return !!mp2.getLayer(id)}catch(_){return false}})})||[]).length:0}catch(_){return -1}};
      const safeSrc=mp2?.getSource?.('earthline-property-safe-swales-16221')||null;
      return {
        documentTier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
        displayedTier:String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.tier||(window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.mode||''),
        mapMoving:!!mp2?.isMoving?.(),
        regionalState:(window.earthlineRegional15778&&{active:window.earthlineRegional15778.active,mode:window.earthlineRegional15778.mode})||null,
        regionalLayers:regionalIds.map(id=>({id,visibility:vis(id)})),
        propertyLayers:propertyIds.map(id=>({id,visibility:vis(id)})),
        renderedRegional:rendered(regionalIds),
        renderedProperty:rendered(propertyIds),
        safeSourceInternalFeatures:Array.isArray(safeSrc?._data?.features)?safeSrc._data.features.length:null
      };
    }catch(e){return {error:String(e)}}})(),
    modelSummary:mSummary,
    swaleDiagnosticsFull:(typeof M!=='undefined'&&M?.swaleDiagnostics)?JSON.parse(JSON.stringify(M.swaleDiagnostics)):null,
    swaleMetaFull:(typeof M!=='undefined'&&M?.swaleMeta)?JSON.parse(JSON.stringify(M.swaleMeta)):null,
    flowFirstPlacementFull:(typeof M!=='undefined'&&M?.flowFirstPlacement15836)?JSON.parse(JSON.stringify(M.flowFirstPlacement15836)):null,
    terrainHandoffFull:(typeof M!=='undefined'&&M?.terrainHandoff15791)?JSON.parse(JSON.stringify(M.terrainHandoff15791)):null,
    demShape:(()=>{try{
      if(typeof M==='undefined'||!M)return null;
      const candidates={};
      for(const k of Object.keys(M).filter(k=>/dem|elev|terrain/i.test(k))){
        const v=M[k];
        if(Array.isArray(v)){
          candidates[k]={length:v.length,nested:Array.isArray(v[0])?v[0].length:null,
            min:(()=>{try{const a=(Array.isArray(v[0])?v.flat(2):v).filter(Number.isFinite);return a.length?Math.min(...a.slice(0,200000)):null}catch(_){return null}})(),
            max:(()=>{try{const a=(Array.isArray(v[0])?v.flat(2):v).filter(Number.isFinite);return a.length?Math.max(...a.slice(0,200000)):null}catch(_){return null}})()
          };
        }
      }
      return candidates;
    }catch(_){return null}})()
  };
},{target:TARGET,serialBefore,pre,started,propertyStarted,settled});

diag.firstRenderedPropertyMs=firstRenderedPropertyMs;
diag.pageErrors=errors;
fs.writeFileSync('iowa-live-diagnostic.json',JSON.stringify(diag,null,2));
console.log('EARTHLINE_IOWA_DIAGNOSTIC '+JSON.stringify(diag));
await browser.close();

// EARTHLINE 17702 exact-core diagnostic revalidation

// MANTRA75_PRESENTATION_REPAIR_RETEST
