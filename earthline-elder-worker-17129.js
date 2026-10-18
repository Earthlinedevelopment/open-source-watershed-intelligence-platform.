import { fromUrl } from "https://cdn.jsdelivr.net/npm/geotiff@3.0.5/+esm";
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.29.5/full/pyodide.mjs";

const ROOT="https://dataforgood-fb-data.s3.amazonaws.com/forests/v2/global/dinov3_global_chm_v2_ml3/chm/";
const RANGE_PROXY="https://ccucaqwbdsskcwxxbqiz.supabase.co/functions/v1/earthline-chmv2-range";
const METHOD="earthline-elder-tree-aoi-chmv2-v0.7-high-recall-plateau-collapse";
let pyReady=null;
const tileCache17196=new Map();

function tileXY(lon,lat,z=10){
  lat=Math.max(-85.05112878,Math.min(85.05112878,lat));
  const n=1<<z;
  const x=Math.floor(Math.min(n-1,Math.max(0,(lon+180)/360*n)));
  const s=Math.sin(lat*Math.PI/180);
  const y=Math.floor(Math.min(n-1,Math.max(0,(0.5-Math.log((1+s)/(1-s))/(4*Math.PI))*n)));
  return [x,y];
}
function quadkey(x,y,z=10){
  let out="";
  for(let i=z;i>0;i--){
    const bit=1<<(i-1);let d=0;
    if(x&bit)d+=1;if(y&bit)d+=2;out+=String(d);
  }
  return out;
}
function bboxTiles(b,z=10){
  const [minlon,minlat,maxlon,maxlat]=b;
  const [x0,y1]=tileXY(minlon,minlat,z),[x1,y0]=tileXY(maxlon,maxlat,z);
  const out=[];
  for(let y=Math.min(y0,y1);y<=Math.max(y0,y1);y++)
    for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++)out.push(quadkey(x,y,z));
  return out;
}
function merc(lon,lat){
  const R=6378137;
  lat=Math.max(-85.05112878,Math.min(85.05112878,lat));
  return [R*lon*Math.PI/180,R*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))];
}
function hav(a,b){
  const R=6371008.8,p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180;
  const dp=(b[1]-a[1])*Math.PI/180,dl=(b[0]-a[0])*Math.PI/180;
  const q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));
}
async function ensurePy(){
  if(pyReady)return pyReady;
  pyReady=(async()=>{
    const py=await loadPyodide({
      indexURL:"https://cdn.jsdelivr.net/pyodide/v0.29.5/full/",
      packages:["numpy"]
    }); /* EARTHLINE 17526 — overlap approved NumPy package load with Pyodide bootstrap; science unchanged. */
    const src=await fetch("tools/elder_trees/chmv2_array_detector_17129.py",{cache:"no-store"});
    if(!src.ok)throw new Error("array detector "+src.status);
    await py.runPythonAsync(await src.text());
    return py;
  })();
  return pyReady;
}
function f32(values){
  if(values instanceof Float32Array)return values;
  const out=new Float32Array(values.length);
  for(let i=0;i<values.length;i++)out[i]=Number(values[i]);
  return out;
}
function projectedWindow(image,bbox){
  const origin=image.getOrigin(),res=image.getResolution(),ib=image.getBoundingBox();
  const rx=Number(res[0]),ry=Number(res[1]),ox=Number(origin[0]),oy=Number(origin[1]);
  if(!Number.isFinite(rx)||!Number.isFinite(ry)||rx===0||ry===0)throw new Error("invalid GeoTIFF resolution");
  const a=merc(bbox[0],bbox[1]),c=merc(bbox[2],bbox[3]);
  let left=Math.max(Math.min(a[0],c[0]),Number(ib[0]));
  let right=Math.min(Math.max(a[0],c[0]),Number(ib[2]));
  let bottom=Math.max(Math.min(a[1],c[1]),Number(ib[1]));
  let top=Math.min(Math.max(a[1],c[1]),Number(ib[3]));
  if(!(left<right&&bottom<top))return null;
  let col0=Math.floor((left-ox)/rx);
  let row0=Math.floor((top-oy)/ry);
  let ww=Math.max(1,Math.round((right-left)/Math.abs(rx)));
  let wh=Math.max(1,Math.round((top-bottom)/Math.abs(ry)));
  col0=Math.max(0,Math.min(image.getWidth()-1,col0));
  row0=Math.max(0,Math.min(image.getHeight()-1,row0));
  ww=Math.max(1,Math.min(image.getWidth()-col0,ww));
  wh=Math.max(1,Math.min(image.getHeight()-row0,wh));
  return {origin,res,ib,rx,ry,ox,oy,col0,row0,ww,wh,left,right,bottom,top};
}
async function getTile17196(q){
  let cached=tileCache17196.get(q);
  if(!cached){
    const transport=RANGE_PROXY+"?q="+encodeURIComponent(q);
    cached=(async()=>{
      const tif=await fromUrl(transport,{cacheSize:96});
      const image=await tif.getImage();
      return {tif,image};
    })();
    tileCache17196.set(q,cached);
  }
  try{return await cached}catch(err){tileCache17196.delete(q);throw err}
}
async function warmTiles17210(bbox){
  const qs=bboxTiles(bbox);
  await Promise.all(qs.map(q=>getTile17196(q)));
  return {warmBbox:true,requested_tiles:qs};
}
async function processTile(py,q,bbox,maxPerTile=240){
  const tTile0=performance.now();
  const url=ROOT+q+".tif";
  let tif,image;
  try{
    ({tif,image}=await getTile17196(q));
  }catch(err){
    return {features:[],tile:{quadkey:q,status:"NO_TILE",error:String(err?.message||err)}};
  } /* EARTHLINE_ELDER_LIGHT_TILE_WARM_17210 */
  const tOpen=performance.now();
  const debugGeo={origin:image.getOrigin(),resolution:image.getResolution(),bbox:image.getBoundingBox(),projectedSW:merc(bbox[0],bbox[1]),projectedNE:merc(bbox[2],bbox[3])};
  const w=projectedWindow(image,bbox);
  if(!w)return {features:[],tile:{quadkey:q,status:"NO_INTERSECTION",debugGeo}};
  const aspect=w.ww/Math.max(1,w.wh);
  let ow,oh;
  if(Math.max(w.ww,w.wh)<=1024){
    // Preserve the source window exactly. Upscaling a small Property AOI adds
    // no CHMv2 information and only multiplies scipy work.
    ow=w.ww;oh=w.wh;
  }else if(aspect>=1){ow=1024;oh=Math.max(1,Math.round(1024/aspect))}
  else{oh=1024;ow=Math.max(1,Math.round(1024*aspect))}
  /* EARTHLINE_ELDER_NO_SCREEN_UPSAMPLE_17215 */
  /* EARTHLINE 17413 — exact raw-window fastpath.
     When the requested screening size already equals the source window, do not
     invoke GeoTIFF's resampler. Returned pixels are the same source samples. */
  const screenOptions17413={
    window:[w.col0,w.row0,w.col0+w.ww,w.row0+w.wh],
    samples:[0],interleave:true
  };
  if(ow!==w.ww||oh!==w.wh){
    screenOptions17413.width=ow;
    screenOptions17413.height=oh;
    screenOptions17413.resampleMethod="nearest";
  }
  const screenRaw=await image.readRasters(screenOptions17413);
  const tScreen=performance.now();
  const pix=Math.max(Math.abs(w.rx),Math.abs(w.ry));
  const pad=Math.max(64,Math.ceil(60/Math.max(.01,pix)));
  const ncol0=Math.max(0,w.col0-pad),nrow0=Math.max(0,w.row0-pad);
  const ncol1=Math.min(image.getWidth(),w.col0+w.ww+pad),nrow1=Math.min(image.getHeight(),w.row0+w.wh+pad);
  const nativeRaw=await image.readRasters({
    window:[ncol0,nrow0,ncol1,nrow1],samples:[0],interleave:true
  });
  const tNative=performance.now();
  const screen=f32(screenRaw),native=f32(nativeRaw);
  const sid="screen_"+q+".bin",nid="native_"+q+".bin";
  py.FS.writeFile("/tmp/"+sid,new Uint8Array(screen.buffer,screen.byteOffset,screen.byteLength));
  py.FS.writeFile("/tmp/"+nid,new Uint8Array(native.buffer,native.byteOffset,native.byteLength));
  const meta={
    bbox,quadkey:q,source_url:url,res_x:w.rx,res_y:w.ry,
    screen_col0:w.col0,screen_row0:w.row0,screen_ww:w.ww,screen_wh:w.wh,
    native_col0:ncol0,native_row0:nrow0,
    origin_x:w.ox,origin_y:w.oy
  };
  py.globals.set("__el_meta",JSON.stringify(meta));
  let out;
  try{
    const txt=py.runPython(
      "json.dumps(detect_from_files('/tmp/"+sid+"',"+oh+","+ow+",'/tmp/"+nid+"',"+(nrow1-nrow0)+","+(ncol1-ncol0)+",__el_meta,"+maxPerTile+",True))"
    );
    out=JSON.parse(String(txt));
  }finally{
    try{py.FS.unlink("/tmp/"+sid)}catch(_){}
    try{py.FS.unlink("/tmp/"+nid)}catch(_){}
    try{py.globals.delete("__el_meta")}catch(_){}
  }
  const tDone=performance.now();
  out.tile=Object.assign({},out.tile||{quadkey:q,status:'OK'},{
    worker_timings_ms:{
      open:Number((tOpen-tTile0).toFixed(1)),
      screen:Number((tScreen-tOpen).toFixed(1)),
      native:Number((tNative-tScreen).toFixed(1)),
      python:Number((tDone-tNative).toFixed(1)),
      total:Number((tDone-tTile0).toFixed(1))
    }
  });
  return out;
} /* EARTHLINE_ELDER_WORKER_TIMINGS_17213 */
function dedupe(features,minM=10){
  const out=[];
  const sorted=[...features].sort((a,b)=>Number(b?.properties?.height_m||0)-Number(a?.properties?.height_m||0));
  for(const f of sorted){
    const p=f?.geometry?.coordinates;
    if(!Array.isArray(p))continue;
    if(out.every(g=>hav(p,g.geometry.coordinates)>=minM))out.push(f);
  }
  return out;
}
function displaySubset(features,limit=24,bbox=null){
  const rank=(a,b)=>
    Number(b?.properties?.elder_tree_confidence_pct||0)-Number(a?.properties?.elder_tree_confidence_pct||0) ||
    Number(b?.properties?.height_m||0)-Number(a?.properties?.height_m||0);
  const items=[...features].sort(rank);
  if(items.length<=limit)return items;

  let west=Number(bbox?.[0]),south=Number(bbox?.[1]),east=Number(bbox?.[2]),north=Number(bbox?.[3]);
  if(![west,south,east,north].every(Number.isFinite)||!(west<east&&south<north)){
    west=Infinity;south=Infinity;east=-Infinity;north=-Infinity;
    for(const f of items){
      const c=f?.geometry?.coordinates;if(!Array.isArray(c))continue;
      west=Math.min(west,+c[0]);east=Math.max(east,+c[0]);
      south=Math.min(south,+c[1]);north=Math.max(north,+c[1]);
    }
  }

  const cols=6,rows=4,dx=Math.max(1e-12,east-west),dy=Math.max(1e-12,north-south);
  const cells=new Map();
  for(const f of items){
    const c=f?.geometry?.coordinates;if(!Array.isArray(c))continue;
    const ix=Math.min(cols-1,Math.max(0,Math.floor((+c[0]-west)/dx*cols)));
    const iy=Math.min(rows-1,Math.max(0,Math.floor((+c[1]-south)/dy*rows)));
    const key=iy*cols+ix;
    const prior=cells.get(key);
    if(!prior||rank(f,prior)<0)cells.set(key,f);
  }

  const chosen=[...cells.values()].sort(rank).slice(0,limit);
  const picked=new Set(chosen);

  // Fill remaining slots by maximizing distance from already chosen points,
  // using evidence rank only as a tie-breaker. This preserves real clustering
  // when the candidate pool is genuinely clustered, but prevents the display
  // subset itself from creating artificial east/west concentration.
  while(chosen.length<limit){
    let best=null,bestD=-1;
    for(const f of items){
      if(picked.has(f))continue;
      const c=f?.geometry?.coordinates;if(!Array.isArray(c))continue;
      const nx=(+c[0]-west)/dx,ny=(+c[1]-south)/dy;
      let d=Infinity;
      for(const g of chosen){
        const gc=g?.geometry?.coordinates;if(!Array.isArray(gc))continue;
        const gx=(+gc[0]-west)/dx,gy=(+gc[1]-south)/dy;
        d=Math.min(d,(nx-gx)*(nx-gx)+(ny-gy)*(ny-gy));
      }
      if(d>bestD+1e-12||(Math.abs(d-bestD)<=1e-12&&best&&rank(f,best)<0)){best=f;bestD=d}
    }
    if(!best)break;
    chosen.push(best);picked.add(best);
  }
  return chosen;
} /* EARTHLINE_ELDER_AOI_BALANCED_DISPLAY_17198 */
async function detect(bbox,{displayPerTile=24,maxPerTile=240}={}){
  const tDetect0=performance.now();
  if(!Array.isArray(bbox)||bbox.length!==4||bbox.some(v=>!Number.isFinite(Number(v))))throw new Error("invalid bbox");
  bbox=bbox.map(Number);
  if(!(bbox[0]<bbox[2]&&bbox[1]<bbox[3]))throw new Error("invalid bbox order");
  const qs=bboxTiles(bbox);
  if(qs.length>16)throw new Error("bounded AOI required; "+qs.length+" CHMv2 tiles");
  const py=await ensurePy();
  const tPyReady=performance.now();
  const features=[],tiles=[];
  for(const q of qs){
    const r=await processTile(py,q,bbox,maxPerTile);
    features.push(...(r.features||[]));tiles.push(r.tile||{quadkey:q,status:"UNKNOWN"});
  }
  const pool=dedupe(features,10).map(f=>({
    type:"Feature",
    geometry:f.geometry,
    properties:Object.assign({},f.properties||{},{
      science_baseline:"17118",
      method_version:METHOD,
      elder_evidence_class:"MODELED_CHMV2"
    })
  }));
  const display=displaySubset(pool,displayPerTile,bbox);
  return {
    type:"FeatureCollection",features:display,
    earthline:{
      science_baseline:"17118",method_version:METHOD,bbox,requested_tiles:qs,
      candidate_pool_count:pool.length,display_count:display.length,
      count_owner:"candidate_pool",map_owner:"display_subset",
      preserve_all_eligible:true,tile_results:tiles,
      worker_timings_ms:{ensurePy:Number((tPyReady-tDetect0).toFixed(1)),total:Number((performance.now()-tDetect0).toFixed(1)),tiles:tiles.map(t=>t?.worker_timings_ms||null)},
      scientific_boundary:"Modeled remote-sensing candidates only; not proof of age, veteran status, or mycorrhizal-hub status."
    },
    candidatePool:pool
  };
}
self.onmessage=async(e)=>{
  const id=e.data?.id;
  try{
    if(e.data?.warm===true){
      const t0=performance.now();
      await ensurePy();
      self.postMessage({id,ok:true,warm:true,elapsedMs:performance.now()-t0});
      return;
    }
    if(e.data?.warmBbox===true){
      const bbox=(e.data?.bbox||[]).map(Number);
      const result=await warmTiles17210(bbox);
      self.postMessage({id,ok:true,result});
      return;
    }
    const result=await detect(e.data?.bbox,e.data?.options||{});
    self.postMessage({id,ok:true,result});
  }catch(err){
    self.postMessage({id,ok:false,warm:e.data?.warm===true,error:String(err?.stack||err?.message||err)});
  }
};
