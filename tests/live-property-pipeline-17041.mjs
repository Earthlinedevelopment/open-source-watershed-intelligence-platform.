import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.goto('https://earthlinedevelopment.org/?propdiag17041='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForTimeout(2500);

const invoke=await page.evaluate(async()=>{
  const t={lng:-105.55114,lat:39.02639,source:'diag17041',code:'',score:0,query:'Colorado',parentRunToken:'',at:new Date().toISOString()};
  window.EARTHLINE_PROPERTY_TARGET_16201=t;
  try{window.earthlineSetPropertyTarget16201?.(t);}catch(_){}
  try{window.earthlineMap?.jumpTo?.({center:[t.lng,t.lat],zoom:17,bearing:0,pitch:0});}catch(_){}
  try{
    const v=await Promise.resolve(window.earthlineDeclarePropertyAtCrosshair16173());
    return {value:v};
  }catch(e){return {error:String(e?.stack||e)}}
});
await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:130000,polling:200}).catch(()=>{});
await page.waitForTimeout(1800);
await page.evaluate(async()=>{
  try{if(typeof window.earthlineSyncPropertyTexture16169==='function')await Promise.resolve(window.earthlineSyncPropertyTexture16169('diag17041-force'));}catch(_){}
});
await page.waitForTimeout(700);

const out=await page.evaluate(()=>{
  const mp=window.earthlineMap;
  const m=window.M||{};
  const raw=Array.isArray(m.swales)?m.swales:[];
  const safeFC=m.authoritativeSafeSwales15815;
  const safe=Array.isArray(safeFC?.features)?safeFC.features:[];
  const sourceIds=[];
  try{
    const style=mp?.getStyle?.();
    for(const id of Object.keys(style?.sources||{})){
      if(/property|swale|safe|natural/i.test(id))sourceIds.push(id);
    }
  }catch(_){}
  const sources={};
  for(const id of sourceIds){
    try{
      const src=mp.getSource(id);
      const data=src?._data||null;
      sources[id]={
        features:Array.isArray(data?.features)?data.features.length:null,
        roles:Array.isArray(data?.features)?data.features.reduce((a,f)=>{const r=String(f?.properties?.geometry_role||f?.properties?.role||'none');a[r]=(a[r]||0)+1;return a;},{}):null
      };
    }catch(e){sources[id]={error:String(e)}}
  }
  function rawBins(){
    const bins={}; let n=0;
    for(const sw of raw){
      const pts=Array.isArray(sw?.pts)?sw.pts:[];
      if(!pts.length)continue;
      const p=pts[Math.floor((pts.length-1)/2)];
      const x=Number(p?.[0]), y=Number(p?.[1]);
      if(!Number.isFinite(x)||!Number.isFinite(y))continue;
      const gx=Number(m.GW||window.GW||0),gy=Number(m.GH||window.GH||0);
      if(!gx||!gy)continue;
      const bx=Math.max(0,Math.min(5,Math.floor(x*6/gx)));
      const by=Math.max(0,Math.min(5,Math.floor(y*6/gy)));
      const k=bx+','+by;bins[k]=(bins[k]||0)+1;n++;
    }
    return {n,bins,occupied:Object.keys(bins).length};
  }
  function geoBins(features){
    const bins={}; let n=0;
    const frame=m.analysisBoundaryLngLat||m.loc?.analysisBoundaryLngLat||[];
    const lngs=frame.map(p=>Number(p?.[0])).filter(Number.isFinite), lats=frame.map(p=>Number(p?.[1])).filter(Number.isFinite);
    if(!lngs.length||!lats.length)return {n:0,bins:{},occupied:0};
    const minX=Math.min(...lngs),maxX=Math.max(...lngs),minY=Math.min(...lats),maxY=Math.max(...lats);
    for(const f of features){
      const g=f?.geometry; if(!g)continue;
      let coords=g.coordinates;
      if(g.type==='MultiLineString')coords=coords?.[0];
      if(!Array.isArray(coords)||!Array.isArray(coords[0]))continue;
      const p=coords[Math.floor((coords.length-1)/2)];
      const x=Number(p?.[0]),y=Number(p?.[1]);
      if(!Number.isFinite(x)||!Number.isFinite(y))continue;
      const bx=Math.max(0,Math.min(5,Math.floor((x-minX)*6/Math.max(1e-12,maxX-minX))));
      const by=Math.max(0,Math.min(5,Math.floor((y-minY)*6/Math.max(1e-12,maxY-minY))));
      const k=bx+','+by;bins[k]=(bins[k]||0)+1;n++;
    }
    return {n,bins,occupied:Object.keys(bins).length};
  }
  const safeBins=geoBins(safe);
  return {
    run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||m.propertyPublication15816||null,
    texture:typeof window.earthlinePropertyTextureAudit16169==='function'?window.earthlinePropertyTextureAudit16169():window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169||null,
    fallback:window.EARTHLINE_PROPERTY_FALLBACK_FAIL_VISIBLE_17011?.last||null,
    counts:{engine:raw.length,safe:safe.length},
    rawBins:rawBins(),
    safeBins,
    sources,
    frame:m.analysisBoundaryLngLat||m.loc?.analysisBoundaryLngLat||null,
    noBuild:m.noBuildProvenance15843||null,
    coverage:m.coverageDiagnostic15803||null,
    swaleMeta:m.swaleMeta||null
  };
});
console.log('PROPERTY_PIPELINE_17041 '+JSON.stringify({invoke,out}));
if(invoke?.error) throw new Error(invoke.error);
if(!out.run?.result) throw new Error('Property run did not publish: '+JSON.stringify(out.run));
await browser.close();