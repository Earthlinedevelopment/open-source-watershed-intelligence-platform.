import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value='Texas';
  i.dispatchEvent(new Event('input',{bubbles:true}));
  i.dispatchEvent(new Event('change',{bubbles:true}));
  b.click();
});

let timedOut=false;
try{
  await page.waitForFunction(()=>{
    const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
    return /screening published\./i.test(s)||/ANALYSIS FAILED/i.test(s)||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;
  },{timeout:35000,polling:100});
}catch(_){timedOut=true;}

// Groundwater context is intentionally asynchronous to the Regional corridor result.
await page.waitForTimeout(8000);

const snap=await page.evaluate(()=>{
  const statFeatures=features=>{
    const out={total:0,east:0,central:0,west:0,unknown:0,bbox:null,names:[]};
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    const pts=[];
    const walk=c=>{if(!Array.isArray(c))return;if(c.length>=2&&Number.isFinite(+c[0])&&Number.isFinite(+c[1])){pts.push([+c[0],+c[1]]);return;}for(const x of c)walk(x);};
    for(const f of features||[]){
      out.total++;
      const n=String(f?.properties?.name||f?.properties?.NAME||f?.properties?.AQ_NAME||'').trim();
      if(n&&!out.names.includes(n)&&out.names.length<30)out.names.push(n);
      pts.length=0;walk(f?.geometry?.coordinates);
      if(!pts.length){out.unknown++;continue;}
      let sx=0,sy=0;for(const [x,y] of pts){sx+=x;sy+=y;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
      const lon=sx/pts.length;
      if(lon>-96)out.east++;else if(lon<-100)out.west++;else out.central++;
    }
    if(Number.isFinite(minX))out.bbox=[minX,minY,maxX,maxY];
    return out;
  };
  const statPolys=polys=>{
    const features=(polys||[]).map((p,i)=>({type:'Feature',properties:{name:p?.name||('poly-'+i)},geometry:{type:'Polygon',coordinates:[(p?.lngLatPts||[])]}}));
    return statFeatures(features);
  };
  const m=typeof M!=='undefined'?M:null;
  const map=typeof earthlineMap!=='undefined'?earthlineMap:null;
  const sourceId=typeof EARTHLINE_AQUIFER_SOURCE!=='undefined'?EARTHLINE_AQUIFER_SOURCE:null;
  const fillId=typeof EARTHLINE_AQUIFER_FILL!=='undefined'?EARTHLINE_AQUIFER_FILL:null;
  const lineId=typeof EARTHLINE_AQUIFER_LINE!=='undefined'?EARTHLINE_AQUIFER_LINE:null;
  const liveSource=map&&sourceId?map.getSource(sourceId):null;
  const liveData=liveSource?._data||null;
  let generated=null,embedded=null,bbox=null;
  try{generated=typeof earthlineAquiferGeoJSON==='function'?earthlineAquiferGeoJSON():null;}catch(_){}
  try{bbox=typeof currentMapBBox==='function'?currentMapBBox():null;}catch(_){}
  try{embedded=typeof earthlineEmbeddedAquifersForBBox==='function'&&bbox?{type:'FeatureCollection',features:earthlineEmbeddedAquifersForBBox(bbox)}:null;}catch(_){}
  const layerState=id=>{
    if(!map||!id)return null;
    try{return {exists:!!map.getLayer(id),visibility:map.getLayer(id)?map.getLayoutProperty(id,'visibility'):null};}catch(e){return {error:String(e)};}
  };
  return {
    usgsAquifers:statPolys(m?.usgsAquifers||[]),
    generatedGeoJSON:statFeatures(generated?.features||[]),
    embeddedInView:statFeatures(embedded?.features||[]),
    liveSource:statFeatures(liveData?.features||[]),
    sourceId,fillId,lineId,
    fillLayer:layerState(fillId),lineLayer:layerState(lineId),
    layerToggle:m?.layers?.usgsAquifer||null,
    visibilityAudit:window.EARTHLINE_REGIONAL_AQUIFER_VISIBILITY_AUDIT_16374||null,
    bbox,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
  };
});

console.log('EARTHLINE_AQUIFER_OWNER_DIAG '+JSON.stringify({timedOut,snap,errors:errors.slice(0,20)}));
await browser.close();
if(timedOut||snap.lastError)process.exitCode=1;
