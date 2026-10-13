import { fromUrl } from "https://cdn.jsdelivr.net/npm/geotiff@3.0.5/+esm";
import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v0.29.5/full/pyodide.mjs";

const ROOT="https://dataforgood-fb-data.s3.amazonaws.com/forests/v2/global/dinov3_global_chm_v2_ml3/chm/";
const METHOD="earthline-elder-tree-aoi-chmv2-v0.7-high-recall-plateau-collapse";
let pyReady=null;

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
    const py=await loadPyodide({indexURL:"https://cdn.jsdelivr.net/pyodide/v0.29.5/full/"});
    await py.loadPackage(["numpy","scipy"]);
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
  const [a,b]=merc(bbox[0],bbox[1]),[c,d]=merc(bbox[2],bbox[3]);
  let left=Math.max(Math.min(a[0],c[0]),Number(ib[0]));
  let right=Math.min(Math.max(a[0],c[0]),Number(ib[2]));
  let bottom=Math.max(Math.min(b[1],d[1]),Number(ib[1]));
  let top=Math.min(Math.max(b[1],d[1]),Number(ib[3]));
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
async function processTile(py,q,bbox,maxPerTile=240){
  const url=ROOT+q+".tif";
  let tif,image;
  try{
    tif=await fromUrl(url,{cacheSize:32});
    image=await tif.getImage();
  }catch(err){
    return {features:[],tile:{quadkey:q,status:"NO_TILE",error:String(err?.message||err)}};
  }
  const w=projectedWindow(image,bbox);
  if(!w)return {features:[],tile:{quadkey:q,status:"NO_INTERSECTION"}};
  const aspect=w.ww/Math.max(1,w.wh);
  let ow,oh;
  if(aspect>=1){ow=1024;oh=Math.max(32,Math.round(1024/aspect))}
  else{oh=1024;ow=Math.max(32,Math.round(1024*aspect))}
  const screenRaw=await image.readRasters({
    window:[w.col0,w.row0,w.col0+w.ww,w.row0+w.wh],
    samples:[0],interleave:true,width:ow,height:oh,resampleMethod:"nearest"
  });
  const pix=Math.max(Math.abs(w.rx),Math.abs(w.ry));
  const pad=Math.max(64,Math.ceil(60/Math.max(.01,pix)));
  const ncol0=Math.max(0,w.col0-pad),nrow0=Math.max(0,w.row0-pad);
  const ncol1=Math.min(image.getWidth(),w.col0+w.ww+pad),nrow1=Math.min(image.getHeight(),w.row0+w.wh+pad);
  const nativeRaw=await image.readRasters({
    window:[ncol0,nrow0,ncol1,nrow1],samples:[0],interleave:true
  });
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
  return out;
}
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
function displaySubset(features,perTile=24){
  const groups=new Map();
  for(const f of features){
    const q=String(f?.properties?.quadkey||"");
    if(!groups.has(q))groups.set(q,[]);
    groups.get(q).push(f);
  }
  const out=[];
  for(const items of groups.values()){
    items.sort((a,b)=>
      Number(b?.properties?.elder_tree_confidence_pct||0)-Number(a?.properties?.elder_tree_confidence_pct||0) ||
      Number(b?.properties?.height_m||0)-Number(a?.properties?.height_m||0)
    );
    out.push(...items.slice(0,perTile));
  }
  return out;
}
async function detect(bbox,{displayPerTile=24,maxPerTile=240}={}){
  if(!Array.isArray(bbox)||bbox.length!==4||bbox.some(v=>!Number.isFinite(Number(v))))throw new Error("invalid bbox");
  bbox=bbox.map(Number);
  if(!(bbox[0]<bbox[2]&&bbox[1]<bbox[3]))throw new Error("invalid bbox order");
  const qs=bboxTiles(bbox);
  if(qs.length>16)throw new Error("bounded AOI required; "+qs.length+" CHMv2 tiles");
  const py=await ensurePy();
  const features=[],tiles=[];
  for(const q of qs){
    const r=await processTile(py,q,bbox,maxPerTile);
    features.push(...(r.features||[]));tiles.push(r.tile||{quadkey:q,status:"UNKNOWN"});
  }
  const pool=dedupe(features,10),display=displaySubset(pool,displayPerTile);
  return {
    type:"FeatureCollection",features:display,
    earthline:{
      science_baseline:"17118",method_version:METHOD,bbox,requested_tiles:qs,
      candidate_pool_count:pool.length,display_count:display.length,
      count_owner:"candidate_pool",map_owner:"display_subset",
      preserve_all_eligible:true,tile_results:tiles,
      scientific_boundary:"Modeled remote-sensing candidates only; not proof of age, veteran status, or mycorrhizal-hub status."
    },
    candidatePool:pool
  };
}
self.onmessage=async(e)=>{
  const id=e.data?.id;
  try{
    const result=await detect(e.data?.bbox,e.data?.options||{});
    self.postMessage({id,ok:true,result});
  }catch(err){
    self.postMessage({id,ok:false,error:String(err?.stack||err?.message||err)});
  }
};
