import { chromium } from 'playwright';

const URL='https://live.earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
try{
  const started=Date.now();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  });
  await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329?.passed===true||!!window.EARTHLINE_LAST_ERROR_15970,null,{timeout:50000,polling:150});
  await page.waitForTimeout(1500);
  const result=await page.evaluate(()=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const src=mp?.getSource?.('el-live-flows-15970');
    const fc=src?._data||src?._options?.data||{type:'FeatureCollection',features:[]};
    const flows=(fc.features||[]).filter(f=>f?.properties?.feature_type==='flow'&&f?.geometry);
    const style=mp?.getStyle?.()||{};
    const layers=(style.layers||[]);
    const waterLayers=layers.filter(l=>{const tag=((l.id||'')+' '+(l['source-layer']||'')).toLowerCase();return /water|lake|reservoir|riverbank|ocean|sea/.test(tag)}).map(l=>l.id).filter(Boolean);
    const candidates=[];
    try{candidates.push(...(mp.queryRenderedFeatures(undefined,{layers:waterLayers})||[]));}catch(_){}
    const pairs=new Map();
    for(const l of layers){const tag=((l.id||'')+' '+(l['source-layer']||'')).toLowerCase();if(!/water|lake|reservoir|riverbank|ocean|sea/.test(tag))continue;if(l.source&&l['source-layer'])pairs.set(l.source+'|'+l['source-layer'],[l.source,l['source-layer']])}
    for(const [source,sourceLayer] of pairs.values()){try{candidates.push(...(mp.querySourceFeatures(source,{sourceLayer})||[]))}catch(_) {}}
    for(const [sourceId,sourceDef] of Object.entries(style.sources||{})){if(String(sourceDef?.type||'').toLowerCase()!=='vector')continue;try{candidates.push(...(mp.querySourceFeatures(sourceId,{sourceLayer:'water'})||[]))}catch(_) {}}
    const finite=p=>Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]);
    const bboxRing=ring=>{let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const p of ring||[]){if(!finite(p))continue;x0=Math.min(x0,+p[0]);x1=Math.max(x1,+p[0]);y0=Math.min(y0,+p[1]);y1=Math.max(y1,+p[1])}return [x0,y0,x1,y1]};
    const onSeg=(p,a,b)=>{const x=+p[0],y=+p[1],x1=+a[0],y1=+a[1],x2=+b[0],y2=+b[1],dx=x2-x1,dy=y2-y1,len=dx*dx+dy*dy;if(len<1e-20)return Math.hypot(x-x1,y-y1)<1e-10;const cross=(x-x1)*dy-(y-y1)*dx;if(Math.abs(cross)>1e-10)return false;const dot=(x-x1)*dx+(y-y1)*dy;return dot>=0&&dot<=len};
    const inRing=(p,ring)=>{if(!finite(p)||!Array.isArray(ring)||ring.length<3)return false;const x=+p[0],y=+p[1];let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[j],b=ring[i];if(!finite(a)||!finite(b))continue;if(onSeg(p,a,b))return true;const xi=+b[0],yi=+b[1],xj=+a[0],yj=+a[1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/((yj-yi)||1e-15)+xi))inside=!inside}return inside};
    const parts=[];const addPoly=rings=>{if(!Array.isArray(rings)||!rings[0]?.length)return;const bbox=bboxRing(rings[0]);if(!bbox.every(Number.isFinite))return;parts.push({rings,bbox})};
    for(const f of candidates){const g=f?.geometry;if(!g)continue;if(g.type==='Polygon')addPoly(g.coordinates);else if(g.type==='MultiPolygon')for(const p of g.coordinates||[])addPoly(p)}
    const inPart=(p,part)=>{const b=part.bbox;if(p[0]<b[0]||p[0]>b[2]||p[1]<b[1]||p[1]>b[3])return false;if(!inRing(p,part.rings[0]))return false;for(let i=1;i<part.rings.length;i++)if(inRing(p,part.rings[i]))return false;return true};
    const inStyleWater=p=>{for(let i=0;i<parts.length;i++)if(inPart(p,parts[i]))return i;return -1};
    const lines=[];for(const f of flows){const g=f.geometry;if(g.type==='LineString')lines.push(g.coordinates);else if(g.type==='MultiLineString')lines.push(...(g.coordinates||[]))}
    let hits=0,samples=0,vertices=0;const examples=[];
    for(let li=0;li<lines.length;li++){const pts=(lines[li]||[]).filter(finite);for(let i=0;i<pts.length;i++){vertices++;let w=inStyleWater(pts[i]);if(w>=0){hits++;if(examples.length<20)examples.push({kind:'vertex',line:li,i,coord:pts[i],part:w})}if(i===0)continue;const a=pts[i-1],b=pts[i],span=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1])),steps=Math.max(1,Math.ceil(span/.002));for(let k=1;k<steps;k++){samples++;const p=[a[0]+(b[0]-a[0])*k/steps,a[1]+(b[1]-a[1])*k/steps];w=inStyleWater(p);if(w>=0){hits++;if(examples.length<20)examples.push({kind:'segment',line:li,i,coord:p,part:w});break}}}}
    return {flowCount:flows.length,waterLayerIds:waterLayers.slice(0,80),waterLayerCount:waterLayers.length,candidateFeatures:candidates.length,polygonParts:parts.length,vertices,samples,styleWaterHits:hits,examples,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim(),preflight:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null,styleIndex:window.EARTHLINE_STYLE_WATER_INDEX_16584||null,performance:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null};
  });
  const wallMs=Date.now()-started;
  const pass=!!result.preflight?.passed&&result.flowCount>0&&result.styleWaterHits===0&&!/ANALYSIS FAILED/i.test(result.status);
  console.log('MANTRA38_VISIBLE_WATER '+JSON.stringify({pass,wallMs,result,errors:errors.slice(0,20)}));
  if(!pass)process.exitCode=1;
}finally{await page.close();await browser.close();}
