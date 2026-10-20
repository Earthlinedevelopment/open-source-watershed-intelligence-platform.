import { fromUrl } from "https://cdn.jsdelivr.net/npm/geotiff@3.0.5/+esm";

/* EARTHLINE 17527 — native-JS execution backend for the approved Elder 17118
   equations. Same CHMv2 source, thresholds, filters, cohort prior, refinement,
   dedupe and display thinning. Candidate until A/B equivalence gates pass. */
const ROOT="https://dataforgood-fb-data.s3.amazonaws.com/forests/v2/global/dinov3_global_chm_v2_ml3/chm/";
const RANGE_PROXY="https://ccucaqwbdsskcwxxbqiz.supabase.co/functions/v1/earthline-chmv2-range";
const METHOD="earthline-elder-tree-aoi-chmv2-v0.7-high-recall-plateau-collapse";
const CURRENT_ELDER_TARGET_PER_HA=15.0;
const FUTURE_ELDER_RATIO=2.5;
const tileCache=new Map();

function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
function pyRound(v){const f=Math.floor(v),d=v-f;if(d<.5)return f;if(d>.5)return f+1;return f%2===0?f:f+1}
function percentileLinear(values,p){
  const a=Array.from(values).sort((x,y)=>x-y);
  if(!a.length)return NaN;
  const pos=(a.length-1)*p,lo=Math.floor(pos),hi=Math.ceil(pos),t=pos-lo;
  return a[lo]*(1-t)+a[hi]*t;
}
function medianValues(values){
  const a=Array.from(values).sort((x,y)=>x-y),n=a.length;
  if(!n)return NaN;
  return n&1?a[n>>1]:(a[n/2-1]+a[n/2])/2;
}
function upperBound(a,v){let lo=0,hi=a.length;while(lo<hi){const m=(lo+hi)>>1;if(a[m]<=v)lo=m+1;else hi=m}return lo}
function tileXY(lon,lat,z=10){
  lat=clamp(lat,-85.05112878,85.05112878);const n=1<<z;
  const x=Math.floor(clamp((lon+180)/360*n,0,n-1)),s=Math.sin(lat*Math.PI/180);
  const y=Math.floor(clamp((0.5-Math.log((1+s)/(1-s))/(4*Math.PI))*n,0,n-1));
  return [x,y];
}
function quadkey(x,y,z=10){let out="";for(let i=z;i>0;i--){const bit=1<<(i-1);let d=0;if(x&bit)d++;if(y&bit)d+=2;out+=String(d)}return out}
function bboxTiles(b,z=10){const [minlon,minlat,maxlon,maxlat]=b,[x0,y1]=tileXY(minlon,minlat,z),[x1,y0]=tileXY(maxlon,maxlat,z),out=[];for(let y=Math.min(y0,y1);y<=Math.max(y0,y1);y++)for(let x=Math.min(x0,x1);x<=Math.max(x0,x1);x++)out.push(quadkey(x,y,z));return out}
function merc(lon,lat){const R=6378137;lat=clamp(lat,-85.05112878,85.05112878);return [R*lon*Math.PI/180,R*Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))]}
function mercatorToLonLat(x,y){const R=6378137;return [x/R*180/Math.PI,(2*Math.atan(Math.exp(y/R))-Math.PI/2)*180/Math.PI]}
function hav(a,b){const R=6371008.8,p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180,dp=(b[1]-a[1])*Math.PI/180,dl=(b[0]-a[0])*Math.PI/180,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)))}
function f32(values){if(values instanceof Float32Array)return new Float32Array(values);const out=new Float32Array(values.length);for(let i=0;i<values.length;i++)out[i]=Number(values[i]);return out}
function edgeIndex(i,n){return i<0?0:i>=n?n-1:i}
function symIndex(i,n){while(i<0||i>=n){if(i<0)i=-i-1;else i=2*n-i-1}return i}
function medianFilterEdge(a,h,w,size){
  const pad=size>>1,out=new Float32Array(h*w),scratch=new Float32Array(size*size);
  for(let r=0;r<h;r++)for(let c=0;c<w;c++){
    let k=0;for(let dr=-pad;dr<=pad;dr++){const rr=edgeIndex(r+dr,h),base=rr*w;for(let dc=-pad;dc<=pad;dc++)scratch[k++]=a[base+edgeIndex(c+dc,w)]}
    scratch.sort();out[r*w+c]=scratch[scratch.length>>1];
  }
  return out;
}
function uniformFilterEdge(a,h,w,size){
  const pad=size>>1,out=new Float32Array(h*w),den=size*size;
  for(let r=0;r<h;r++)for(let c=0;c<w;c++){
    let sum=0;for(let dr=-pad;dr<=pad;dr++){const rr=edgeIndex(r+dr,h),base=rr*w;for(let dc=-pad;dc<=pad;dc++)sum+=a[base+edgeIndex(c+dc,w)]}
    out[r*w+c]=sum/den;
  }
  return out;
}
function maxFilterEdge(a,h,w,size){
  const pad=size>>1,out=new Float32Array(h*w);
  for(let r=0;r<h;r++)for(let c=0;c<w;c++){
    let best=-Infinity;for(let dr=-pad;dr<=pad;dr++){const rr=edgeIndex(r+dr,h),base=rr*w;for(let dc=-pad;dc<=pad;dc++){const v=a[base+edgeIndex(c+dc,w)];if(v>best)best=v}}
    out[r*w+c]=best;
  }
  return out;
}
function gaussianFilterSym(a,h,w,sigma){
  const radius=Math.max(1,Math.floor(4*sigma+.5)),len=radius*2+1,k=new Float32Array(len);let ks=0;
  for(let i=-radius;i<=radius;i++){const v=Math.fround(Math.exp(-(i*i)/(2*sigma*sigma)));k[i+radius]=v;ks+=v}
  for(let i=0;i<len;i++)k[i]=Math.fround(k[i]/ks);
  const tmp=new Float32Array(h*w),out=new Float32Array(h*w);
  for(let r=0;r<h;r++)for(let c=0;c<w;c++){let sum=0;for(let d=-radius;d<=radius;d++)sum+=a[r*w+symIndex(c+d,w)]*k[d+radius];tmp[r*w+c]=sum}
  for(let r=0;r<h;r++)for(let c=0;c<w;c++){let sum=0;for(let d=-radius;d<=radius;d++)sum+=tmp[symIndex(r+d,h)*w+c]*k[d+radius];out[r*w+c]=sum}
  return out;
}
function components4(mask,h,w){
  const seen=new Uint8Array(h*w),groups=[];
  for(let i=0;i<mask.length;i++){
    if(!mask[i]||seen[i])continue;
    const q=[i],g=[];seen[i]=1;
    for(let qi=0;qi<q.length;qi++){const p=q[qi],r=Math.floor(p/w),c=p-r*w;g.push([r,c]);const ns=[];if(r)ns.push(p-w);if(r+1<h)ns.push(p+w);if(c)ns.push(p-1);if(c+1<w)ns.push(p+1);for(const n of ns)if(mask[n]&&!seen[n]){seen[n]=1;q.push(n)}}
    groups.push(g);
  }
  return groups;
}
function componentSize4(mask,h,w,r,c){
  const start=r*w+c;if(r<0||c<0||r>=h||c>=w||!mask[start])return 0;
  const seen=new Uint8Array(h*w),q=[start];seen[start]=1;
  for(let qi=0;qi<q.length;qi++){const p=q[qi],rr=Math.floor(p/w),cc=p-rr*w;const ns=[];if(rr)ns.push(p-w);if(rr+1<h)ns.push(p+w);if(cc)ns.push(p-1);if(cc+1<w)ns.push(p+1);for(const n of ns)if(mask[n]&&!seen[n]){seen[n]=1;q.push(n)}}
  return q.length;
}
function projectedWindow(image,bbox){
  const origin=image.getOrigin(),res=image.getResolution(),ib=image.getBoundingBox(),rx=+res[0],ry=+res[1],ox=+origin[0],oy=+origin[1];
  if(!Number.isFinite(rx)||!Number.isFinite(ry)||!rx||!ry)throw new Error("invalid GeoTIFF resolution");
  const a=merc(bbox[0],bbox[1]),c=merc(bbox[2],bbox[3]);
  const left=Math.max(Math.min(a[0],c[0]),+ib[0]),right=Math.min(Math.max(a[0],c[0]),+ib[2]),bottom=Math.max(Math.min(a[1],c[1]),+ib[1]),top=Math.min(Math.max(a[1],c[1]),+ib[3]);
  if(!(left<right&&bottom<top))return null;
  let col0=Math.floor((left-ox)/rx),row0=Math.floor((top-oy)/ry),ww=Math.max(1,Math.round((right-left)/Math.abs(rx))),wh=Math.max(1,Math.round((top-bottom)/Math.abs(ry)));
  col0=clamp(col0,0,image.getWidth()-1);row0=clamp(row0,0,image.getHeight()-1);ww=clamp(ww,1,image.getWidth()-col0);wh=clamp(wh,1,image.getHeight()-row0);
  return {rx,ry,ox,oy,col0,row0,ww,wh};
}
async function getTile(q){
  let cached=tileCache.get(q);
  if(!cached){
    cached=(async()=>{const tif=await fromUrl(RANGE_PROXY+"?q="+encodeURIComponent(q),{cacheSize:96});const image=await tif.getImage();return {tif,image}})();
    tileCache.set(q,cached);
  }
  try{return await cached}catch(err){tileCache.delete(q);throw err}
}
async function warmTileRaster17565(q,bbox){
  const {image}=await getTile(q),w=projectedWindow(image,bbox);
  if(!w)return false;
  const aspect=w.ww/Math.max(1,w.wh);let ow,oh;
  if(Math.max(w.ww,w.wh)<=1024){ow=w.ww;oh=w.wh}
  else if(aspect>=1){ow=1024;oh=Math.max(1,Math.round(1024/aspect))}
  else{oh=1024;ow=Math.max(1,Math.round(1024*aspect))}
  const opts={window:[w.col0,w.row0,w.col0+w.ww,w.row0+w.wh],samples:[0],interleave:true};
  if(ow!==w.ww||oh!==w.wh){opts.width=ow;opts.height=oh;opts.resampleMethod="nearest"}
  const pix=Math.max(Math.abs(w.rx),Math.abs(w.ry)),pad=Math.max(64,Math.ceil(60/Math.max(.01,pix))),
    ncol0=Math.max(0,w.col0-pad),nrow0=Math.max(0,w.row0-pad),
    ncol1=Math.min(image.getWidth(),w.col0+w.ww+pad),nrow1=Math.min(image.getHeight(),w.row0+w.wh+pad);
  const nativeOpts={window:[ncol0,nrow0,ncol1,nrow1],samples:[0],interleave:true};
  if(ow===w.ww&&oh===w.wh)await image.readRasters(nativeOpts);
  else await Promise.all([image.readRasters(opts),image.readRasters(nativeOpts)]);
  return true;
}
async function warmTiles(bbox){
  const qs=bboxTiles(bbox);
  await Promise.all(qs.map(q=>warmTileRaster17565(q,bbox)));
  return {warmBbox:true,requested_tiles:qs,exactRasterWindows:true};
}
function compareBestTuple(a,b){
  // a,b = [dist,-structural,x,y,h,emerg,area,openf]
  for(let i=0;i<a.length;i++){if(a[i]<b[i])return -1;if(a[i]>b[i])return 1}return 0;
}
async function processTileJS(q,bbox,maxPerTile=240,preserveAllEligible=true){
  const t0=performance.now();let image;
  try{({image}=await getTile(q))}catch(err){return {features:[],tile:{quadkey:q,status:"NO_TILE",error:String(err?.message||err)}}}
  const tOpen=performance.now(),w=projectedWindow(image,bbox);if(!w)return {features:[],tile:{quadkey:q,status:"NO_INTERSECTION"}};
  const aspect=w.ww/Math.max(1,w.wh);let ow,oh;if(Math.max(w.ww,w.wh)<=1024){ow=w.ww;oh=w.wh}else if(aspect>=1){ow=1024;oh=Math.max(1,Math.round(1024/aspect))}else{oh=1024;ow=Math.max(1,Math.round(1024*aspect))}
  const opts={window:[w.col0,w.row0,w.col0+w.ww,w.row0+w.wh],samples:[0],interleave:true};if(ow!==w.ww||oh!==w.wh){opts.width=ow;opts.height=oh;opts.resampleMethod="nearest"}
  const pix=Math.max(Math.abs(w.rx),Math.abs(w.ry)),pad=Math.max(64,Math.ceil(60/Math.max(.01,pix))),ncol0=Math.max(0,w.col0-pad),nrow0=Math.max(0,w.row0-pad),ncol1=Math.min(image.getWidth(),w.col0+w.ww+pad),nrow1=Math.min(image.getHeight(),w.row0+w.wh+pad),nh=nrow1-nrow0,nw=ncol1-ncol0;
  /* EARTHLINE 17564 — I/O-only exact-window reuse. At native screen resolution,
     the screen window is an exact subset of the already-required padded native
     CHMv2 window. Read that source window once and slice the identical pixels
     instead of issuing a second GeoTIFF range/decode pass. Resampled screens keep
     the unchanged GeoTIFF read path. No thresholds, context radius, refinement,
     ranking, dedupe, cohort prior, or display thinning change. */
  let screen,native,tScreen,tNative;
  if(ow===w.ww&&oh===w.wh){
    native=f32(await image.readRasters({window:[ncol0,nrow0,ncol1,nrow1],samples:[0],interleave:true}));
    tNative=performance.now();
    screen=new Float32Array(w.ww*w.wh);
    const ro=w.row0-nrow0,co=w.col0-ncol0;
    for(let r=0;r<w.wh;r++)screen.set(native.subarray((ro+r)*nw+co,(ro+r)*nw+co+w.ww),r*w.ww);
    tScreen=tNative;
  }else{
    const reads=await Promise.all([
      image.readRasters(opts),
      image.readRasters({window:[ncol0,nrow0,ncol1,nrow1],samples:[0],interleave:true})
    ]);
    screen=f32(reads[0]);native=f32(reads[1]);tScreen=performance.now();tNative=tScreen;
  }

  const z=new Float32Array(screen.length),canopy=new Uint8Array(screen.length),woody=[];
  for(let i=0;i<screen.length;i++){let v=screen[i];if(!Number.isFinite(v)||v<0||v>80)v=0;z[i]=v;if(v>=1.5)woody.push(v)}
  if(woody.length<8)return {features:[],tile:{quadkey:q,status:"NO_CANOPY"}};
  const canopyFloor=Math.max(2,Math.min(5,percentileLinear(woody,.25)));
  const vals=[];for(let i=0;i<z.length;i++)if(z[i]>=canopyFloor){canopy[i]=1;vals.push(z[i])}
  if(vals.length<8)return {features:[],tile:{quadkey:q,status:"NO_CANOPY",canopy_floor_m:+canopyFloor.toFixed(2)}};

  const med=medianFilterEdge(z,oh,ow,9),prom=new Float32Array(z.length),pvals=[];
  for(let i=0;i<z.length;i++){prom[i]=Math.max(0,z[i]-med[i]);if(canopy[i])pvals.push(prom[i])}
  vals.sort((a,b)=>a-b);pvals.sort((a,b)=>a-b);
  const hPct=new Float32Array(z.length),pPct=new Float32Array(z.length),canF=new Float32Array(z.length);
  for(let i=0;i<z.length;i++)canF[i]=canopy[i];
  const density=uniformFilterEdge(canF,oh,ow,9),openContext=new Float32Array(z.length),score=new Float32Array(z.length);
  for(let i=0;i<z.length;i++){
    openContext[i]=Math.max(0,Math.min(1,1-density[i]));
    if(canopy[i]){
      hPct[i]=upperBound(vals,z[i])/Math.max(1,vals.length);
      pPct[i]=upperBound(pvals,prom[i])/Math.max(1,pvals.length);
      score[i]=.40*hPct[i]+.35*pPct[i]+.25*openContext[i];
    }
  }

  const screenPxM=Math.max(Math.abs(w.rx)*w.ww/Math.max(1,ow),Math.abs(w.ry)*w.wh/Math.max(1,oh)),standPx=Math.max(4,Math.round(300/Math.max(screenPxM,.01))),nms0=Math.max(3,Math.round(8/Math.max(screenPxM,.01))),nmsPx=nms0%2?nms0:nms0+1,pixelArea=screenPxM*screenPxM;
  const candidates=[];let forestCells=0,forestCellsWithCandidate=0,forestAreaHa=0,currentTargetTotal=0,futureTargetTotal=0,currentSelectedTotal=0,futureSelectedTotal=0;
  for(let r0=0;r0<oh;r0+=standPx)for(let c0=0;c0<ow;c0+=standPx){
    const r1=Math.min(oh,r0+standPx),c1=Math.min(ow,c0+standPx),ch=r1-r0,cw=c1-c0;let canopyCount=0;
    for(let r=r0;r<r1;r++)for(let c=c0;c<c1;c++)canopyCount+=canopy[r*ow+c];
    forestCells++;const canopyAreaHa=canopyCount*pixelArea/10000;forestAreaHa+=canopyAreaHa;
    const currentTarget=Math.max(1,Math.ceil(canopyAreaHa*CURRENT_ELDER_TARGET_PER_HA)),futureTarget=Math.max(1,Math.ceil(currentTarget*FUTURE_ELDER_RATIO));currentTargetTotal+=currentTarget;futureTargetTotal+=futureTarget;
    const eligible=new Uint8Array(ch*cw),peak=new Uint8Array(ch*cw),rad=nmsPx>>1;
    let any=false;
    for(let rr=0;rr<ch;rr++)for(let cc=0;cc<cw;cc++){const gi=(r0+rr)*ow+c0+cc;if(canopy[gi]&&hPct[gi]>=.35&&(pPct[gi]>=.30||openContext[gi]>=.45)){eligible[rr*cw+cc]=1;any=true}}
    if(!any)continue;
    for(let rr=0;rr<ch;rr++)for(let cc=0;cc<cw;cc++){
      const li=rr*cw+cc;if(!eligible[li])continue;const gi=(r0+rr)*ow+c0+cc,v=score[gi];let mx=-Infinity;
      for(let dr=-rad;dr<=rad;dr++){const rrr=edgeIndex(rr+dr,ch);for(let dc=-rad;dc<=rad;dc++){const ccc=edgeIndex(cc+dc,cw),vv=score[(r0+rrr)*ow+c0+ccc];if(vv>mx)mx=vv}}
      if(v===mx)peak[li]=1;
    }
    const comps=components4(peak,ch,cw),ranked=[];
    for(const comp of comps){
      let best=null;
      for(const [rr,cc] of comp){
        const gi=(r0+rr)*ow+c0+cc,rec=[z[gi],pPct[gi],score[gi],-rr,-cc,rr,cc];
        if(!best||rec[0]>best[0]||rec[0]===best[0]&&(rec[1]>best[1]||rec[1]===best[1]&&(rec[2]>best[2]||rec[2]===best[2]&&(rec[3]>best[3]||rec[3]===best[3]&&rec[4]>best[4]))))best=rec;
      }
      if(best)ranked.push([score[(r0+best[5])*ow+c0+best[6]],r0+best[5],c0+best[6]]);
    }
    if(!ranked.length)continue;forestCellsWithCandidate++;
    ranked.sort((a,b)=>b[0]-a[0]||b[1]-a[1]||b[2]-a[2]);
    const totalTarget=currentTarget+futureTarget,quota=ranked.slice(0,totalTarget);
    const currentN=quota.length>=totalTarget?currentTarget:(quota.length?Math.min(currentTarget,Math.max(1,Math.round(quota.length/(1+FUTURE_ELDER_RATIO)))):0),futureN=Math.min(futureTarget,Math.max(0,quota.length-currentN));
    currentSelectedTotal+=currentN;futureSelectedTotal+=futureN;
    for(let i=0;i<currentN;i++)candidates.push([quota[i][0],quota[i][1],quota[i][2],"CURRENT_ELDER_CANDIDATE"]);
    for(let i=currentN;i<currentN+futureN;i++)candidates.push([quota[i][0],quota[i][1],quota[i][2],"FUTURE_ELDER_CANDIDATE"]);
    if(preserveAllEligible)for(let i=quota.length;i<ranked.length;i++)candidates.push([ranked[i][0],ranked[i][1],ranked[i][2],"OUTSIDE_DENSITY_PRIOR"]);
  }
  candidates.sort((a,b)=>b[0]-a[0]);const ranked=candidates.slice(0,maxPerTile*3),referencePeakCount=candidates.length;

  const nativeClean=new Float32Array(native.length);for(let i=0;i<native.length;i++){const v=native[i];nativeClean[i]=Number.isFinite(v)&&v>=0&&v<=80?v:NaN}
  const refineRadius=Math.max(10,Math.round(15/Math.max(pix,.01))),sep0=Math.max(3,Math.round(5/Math.max(pix,.01))),refineSep=sep0%2?sep0:sep0+1,refineSigma=Math.max(.8,Math.min(2.5,1/Math.max(pix,.01))),localRadius=Math.max(5,Math.round(18/Math.max(pix,.01))),pixelAreaNative=Math.abs(w.rx*w.ry);
  function refine(r,c){
    const fullCol=w.col0+(c+.5)*w.ww/Math.max(1,ow),fullRow=w.row0+(r+.5)*w.wh/Math.max(1,oh),ic=Math.trunc(fullCol)-ncol0,ir=Math.trunc(fullRow)-nrow0,r0=Math.max(0,ir-refineRadius),r1=Math.min(nh,ir+refineRadius+1),c0=Math.max(0,ic-refineRadius),c1=Math.min(nw,ic+refineRadius+1),ah=r1-r0,aw=c1-c0;
    if(!ah||!aw)return null;const a=new Float32Array(ah*aw);for(let rr=0;rr<ah;rr++)for(let cc=0;cc<aw;cc++){const v=nativeClean[(r0+rr)*nw+c0+cc];a[rr*aw+cc]=Number.isFinite(v)?v:0}
    const sm=gaussianFilterSym(a,ah,aw,refineSigma),mx=maxFilterEdge(sm,ah,aw,refineSep),peaks=[];for(let i=0;i<sm.length;i++)if(sm[i]===mx[i]&&sm[i]>=canopyFloor)peaks.push(i);if(!peaks.length)return null;
    const cx=w.ox+fullCol*w.rx,cy=w.oy+fullRow*w.ry;let minD=Infinity,nearest=[];
    for(const idx of peaks){const lr=Math.floor(idx/aw),lc=idx-lr*aw,globalCol=ncol0+c0+lc,globalRow=nrow0+r0+lr,x=w.ox+(globalCol+.5)*w.rx,y=w.oy+(globalRow+.5)*w.ry,d=Math.hypot(x-cx,y-cy);if(d<minD){minD=d;nearest=[[d,lr,lc,x,y]]}else if(d===minD)nearest.push([d,lr,lc,x,y])}
    let best=null;
    for(const [dist,lr,lc,x,y] of nearest){
      const nv=nativeClean[(r0+lr)*nw+c0+lc],h=Number.isFinite(nv)?nv:sm[lr*aw+lc],ar0=Math.max(0,lr-localRadius),ar1=Math.min(ah,lr+localRadius+1),ac0=Math.max(0,lc-localRadius),ac1=Math.min(aw,lc+localRadius+1),lh=ar1-ar0,lw=ac1-ac0,finite=[];
      for(let rr=ar0;rr<ar1;rr++)for(let cc=ac0;cc<ac1;cc++){const v=nativeClean[(r0+rr)*nw+c0+cc];if(Number.isFinite(v))finite.push(v)}
      const medv=finite.length?medianValues(finite):0,emerg=Math.max(0,h-medv),crown=new Uint8Array(lh*lw);let openN=0,total=0;
      const thresh=Math.max(1.5,canopyFloor*.75,h*.45);
      for(let rr=0;rr<lh;rr++)for(let cc=0;cc<lw;cc++){const nv2=nativeClean[(r0+ar0+rr)*nw+c0+ac0+cc],v=Number.isFinite(nv2)?nv2:0;if(v<4)openN++;total++;if(v>=thresh)crown[rr*lw+cc]=1}
      const crownCells=componentSize4(crown,lh,lw,lr-ar0,lc-ac0),area=crownCells*pixelAreaNative,openf=total?openN/total:0,structural=.45*h+.65*emerg+.025*Math.min(area,800)+4*openf,rec=[dist,-structural,x,y,h,emerg,area,openf];
      if(!best||compareBestTuple(rec,best)<0)best=rec;
    }
    if(!best)return null;return [-best[1],...mercatorToLonLat(best[2],best[3]),best[2],best[3],best[4],best[5],best[6],best[7]];
  }
  const feats=[];
  for(let rank=0;rank<ranked.length;rank++){
    const [sc,r,c,cohort]=ranked[rank],ref=refine(r,c);if(!ref)continue;const [structural,lon,lat,x,y,h,emerg,area,openf]=ref;if(!(bbox[0]<=lon&&lon<=bbox[2]&&bbox[1]<=lat&&lat<=bbox[3]))continue;if(feats.some(f=>hav([lon,lat],f.geometry.coordinates)<10))continue;
    feats.push({type:"Feature",geometry:{type:"Point",coordinates:[lon,lat]},properties:{record_class:"ELDER_TREE_CANDIDATE",elder_cohort:cohort,cohort_definition:"CURRENT = top locally ranked structures under the research density prior; FUTURE = successor structures retained for continuity. Neither label proves age.",verification_status:"modeled remote-sensing candidate only",source_class:"MODELED_CHMV2",source_name:"WRI/Meta CHMv2",source_url:ROOT+q+".tif",source_license:"CC BY 4.0",quadkey:q,method_version:METHOD,screen_rank:rank+1,screen_reference_peak_count:referencePeakCount,local_canopy_floor_m:+canopyFloor.toFixed(2),raw_structural_evidence_score:+structural.toFixed(4),screen_structural_score:+sc.toFixed(5),elder_tree_confidence_pct:pyRound(Math.max(0,Math.min(100,100*sc))),confidence_pct:pyRound(Math.max(0,Math.min(100,100*sc))),confidence_definition:"Earthline Elder Tree Confidence is a local relative structural-evidence index built from height rank, local prominence rank, and open-grown context in the analyzed area. It is not the probability that the tree is ancient, veteran, or a mycorrhizal hub.",height_m:+h.toFixed(2),emergent_height_m:+emerg.toFixed(2),crown_area_proxy_m2:+area.toFixed(1),open_context_fraction:+openf.toFixed(3),evidence_limit:"Candidate only; modeled canopy structure is not proof of age or mycorrhizal hub status."}});
    if(feats.length>=maxPerTile)break;
  }
  const tDone=performance.now();
  return {features:feats,tile:{quadkey:q,status:"OK",candidate_count:feats.length,refine_radius_m:15,screen_shape:[oh,ow],canopy_floor_m:+canopyFloor.toFixed(2),reference_peak_count:referencePeakCount,screen_pixel_m:+screenPxM.toFixed(2),stand_target_m:300,forest_cells:forestCells,forest_cells_with_candidate:forestCellsWithCandidate,forest_candidate_coverage_pct:+(100*forestCellsWithCandidate/Math.max(1,forestCells)).toFixed(1),forest_area_ha:+forestAreaHa.toFixed(3),current_elder_target_per_ha:CURRENT_ELDER_TARGET_PER_HA,future_elder_ratio:FUTURE_ELDER_RATIO,current_target_total:currentTargetTotal,future_target_total:futureTargetTotal,current_selected_total:currentSelectedTotal,future_selected_total:futureSelectedTotal,worker_timings_ms:{open:+(tOpen-t0).toFixed(1),screen:+(tScreen-tOpen).toFixed(1),native:+(tNative-tScreen).toFixed(1),nativeJS:+(tDone-tNative).toFixed(1),total:+(tDone-t0).toFixed(1)}}};
}
function dedupe(features,minM=10){const out=[],sorted=[...features].sort((a,b)=>Number(b?.properties?.height_m||0)-Number(a?.properties?.height_m||0));for(const f of sorted){const p=f?.geometry?.coordinates;if(Array.isArray(p)&&out.every(g=>hav(p,g.geometry.coordinates)>=minM))out.push(f)}return out}
function displaySubset(features,limit=24,bbox=null){
  const rank=(a,b)=>Number(b?.properties?.elder_tree_confidence_pct||0)-Number(a?.properties?.elder_tree_confidence_pct||0)||Number(b?.properties?.height_m||0)-Number(a?.properties?.height_m||0),items=[...features].sort(rank);if(items.length<=limit)return items;
  let [west,south,east,north]=bbox||[];const cols=6,rows=4,dx=Math.max(1e-12,east-west),dy=Math.max(1e-12,north-south),cells=new Map();
  for(const f of items){const c=f?.geometry?.coordinates;if(!Array.isArray(c))continue;const ix=clamp(Math.floor((c[0]-west)/dx*cols),0,cols-1),iy=clamp(Math.floor((c[1]-south)/dy*rows),0,rows-1),key=iy*cols+ix,prior=cells.get(key);if(!prior||rank(f,prior)<0)cells.set(key,f)}
  const chosen=[...cells.values()].sort(rank).slice(0,limit),picked=new Set(chosen);
  while(chosen.length<limit){let best=null,bestD=-1;for(const f of items){if(picked.has(f))continue;const c=f.geometry.coordinates,nx=(c[0]-west)/dx,ny=(c[1]-south)/dy;let d=Infinity;for(const g of chosen){const gc=g.geometry.coordinates,gx=(gc[0]-west)/dx,gy=(gc[1]-south)/dy;d=Math.min(d,(nx-gx)**2+(ny-gy)**2)}if(d>bestD+1e-12||(Math.abs(d-bestD)<=1e-12&&best&&rank(f,best)<0)){best=f;bestD=d}}if(!best)break;chosen.push(best);picked.add(best)}
  return chosen;
}
async function detect(bbox,{displayPerTile=24,maxPerTile=240}={}){
  const t0=performance.now();if(!Array.isArray(bbox)||bbox.length!==4||bbox.some(v=>!Number.isFinite(+v)))throw new Error("invalid bbox");bbox=bbox.map(Number);if(!(bbox[0]<bbox[2]&&bbox[1]<bbox[3]))throw new Error("invalid bbox order");const qs=bboxTiles(bbox);if(qs.length>16)throw new Error("bounded AOI required; "+qs.length+" CHMv2 tiles");
  const results=await Promise.all(qs.map(q=>processTileJS(q,bbox,maxPerTile,true))),features=[],tiles=[];for(const r of results){features.push(...(r.features||[]));tiles.push(r.tile)}
  const pool=dedupe(features,10).map(f=>({type:"Feature",geometry:f.geometry,properties:Object.assign({},f.properties||{},{science_baseline:"17118",method_version:METHOD,elder_evidence_class:"MODELED_CHMV2"})})),display=displaySubset(pool,displayPerTile,bbox);
  return {type:"FeatureCollection",features:display,earthline:{science_baseline:"17118",method_version:METHOD,engine_backend:"native-js-equivalent-17560",bbox,requested_tiles:qs,candidate_pool_count:pool.length,display_count:display.length,count_owner:"candidate_pool",map_owner:"display_subset",preserve_all_eligible:true,tile_results:tiles,worker_timings_ms:{ensurePy:0,total:+(performance.now()-t0).toFixed(1),tiles:tiles.map(t=>t?.worker_timings_ms||null)},scientific_boundary:"Modeled remote-sensing candidates only; not proof of age, veteran status, or mycorrhizal-hub status."},candidatePool:pool};
}
self.onmessage=async e=>{const id=e.data?.id;try{if(e.data?.warm===true){self.postMessage({id,ok:true,warm:true,elapsedMs:0});return}if(e.data?.warmBbox===true){const result=await warmTiles((e.data?.bbox||[]).map(Number));self.postMessage({id,ok:true,result});return}const result=await detect(e.data?.bbox,e.data?.options||{});self.postMessage({id,ok:true,result})}catch(err){self.postMessage({id,ok:false,warm:e.data?.warm===true,error:String(err?.stack||err?.message||err)})}};
