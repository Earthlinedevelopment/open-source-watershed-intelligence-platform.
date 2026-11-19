/* Earthline Property Swale Bridge v1.0.0
   Everything the clean swale engine needs from the outside world, as plain testable functions:
     1. decode Mapbox Streets vector tiles (MVT / protobuf) fetched directly for the property area at a fixed zoom
        (never read from what is drawn on screen)
     2. turn roads, buildings, parking, water and wetlands into the engine's two masks on the page grid
     3. audit every proposed swale against the exact vector geometry (not the raster) and drop any that breaks a clearance
     4. convert accepted swales back into the page's corridor objects
   No map, DOM or page globals are read here; the page passes everything in.
   Works in the browser (window.EarthlineSwaleBridge) and in Node (module.exports). */
(function(root){
'use strict';
const VERSION='1.0.0';
const M_PER_DEG=111320;
const SETBACK={builtM:3.05,waterM:18};                       // R6 (10 ft) and R7 (18 m), same values the engine uses

/* Assumed half-widths of mapped centerlines (metres). Provisional modelling assumption: Mapbox roads are centerlines. */
const ROAD_HALF_WIDTH_M=Object.freeze({motorway:9,motorway_link:5,trunk:8,trunk_link:5,primary:7,primary_link:4.5,secondary:6,secondary_link:4,
  tertiary:5,tertiary_link:4,street:4,street_limited:3.5,service:3,track:2.5,path:1.5,pedestrian:2.5,construction:3,golf:1.5,
  major_rail:3.5,minor_rail:3,service_rail:3});
const ROAD_DEFAULT_HALF_WIDTH_M=4;
const SKIP_ROAD_CLASSES=Object.freeze({ferry:1,aerialway:1});
const WATERWAY_HALF_WIDTH_M=Object.freeze({river:5,canal:3,stream:1.5,stream_intermittent:1.5,ditch:1,drain:1});
const WETLAND_CLASSES=Object.freeze({wetland:1,wetland_noveg:1});

/* ---------------- protobuf / MVT decoding ---------------- */
function Reader(u8){this.b=u8;this.p=0;this.n=u8.length;}
Reader.prototype.varint=function(){let r=0,m=1,c;for(let i=0;i<10;i++){if(this.p>=this.n)throw new Error('mvt: truncated varint');c=this.b[this.p++];r+=(c&127)*m;if(c<128)return r;m*=128;}throw new Error('mvt: varint too long');};
Reader.prototype.bytes=function(){const len=this.varint();if(this.p+len>this.n)throw new Error('mvt: truncated field');const s=this.b.subarray(this.p,this.p+len);this.p+=len;return s;};
Reader.prototype.skip=function(wt){if(wt===0)this.varint();else if(wt===1)this.p+=8;else if(wt===2)this.bytes();else if(wt===5)this.p+=4;else throw new Error('mvt: bad wire type '+wt);if(this.p>this.n)throw new Error('mvt: truncated');};
function utf8(u8){let s='';for(let i=0;i<u8.length;i++)s+=String.fromCharCode(u8[i]);try{return decodeURIComponent(escape(s));}catch(_){return s;}}
function zz(n){return (n%2===0)?n/2:-(n+1)/2;}
function readValue(u8){const r=new Reader(u8);let v=null;while(r.p<r.n){const tag=r.varint(),f=Math.floor(tag/8),wt=tag%8;
  if(f===1&&wt===2)v=utf8(r.bytes());
  else if(f===2&&wt===5){const dv=new DataView(r.b.buffer,r.b.byteOffset+r.p,4);v=dv.getFloat32(0,true);r.p+=4;}
  else if(f===3&&wt===1){const dv=new DataView(r.b.buffer,r.b.byteOffset+r.p,8);v=dv.getFloat64(0,true);r.p+=8;}
  else if((f===4||f===5)&&wt===0)v=r.varint();
  else if(f===6&&wt===0)v=zz(r.varint());
  else if(f===7&&wt===0)v=!!r.varint();
  else r.skip(wt);}return v;}
function readFeature(u8){const r=new Reader(u8),ft={tags:[],type:0,geom:[]};while(r.p<r.n){const tag=r.varint(),f=Math.floor(tag/8),wt=tag%8;
  if(f===2&&wt===2){const s=new Reader(r.bytes());while(s.p<s.n)ft.tags.push(s.varint());}
  else if(f===3&&wt===0)ft.type=r.varint();
  else if(f===4&&wt===2){const s=new Reader(r.bytes());while(s.p<s.n)ft.geom.push(s.varint());}
  else r.skip(wt);}return ft;}
function decodeGeometry(type,cmds){ // returns parts: array of arrays of [x,y] in tile units; polygon rings are closed
  const parts=[];let x=0,y=0,cur=null,i=0;
  while(i<cmds.length){const ci=cmds[i++],id=ci%8,count=Math.floor(ci/8);
    if(id===1||id===2){for(let k=0;k<count;k++){x+=zz(cmds[i++]);y+=zz(cmds[i++]);
      if(id===1){cur=[];parts.push(cur);}
      if(!cur){cur=[];parts.push(cur);}
      cur.push([x,y]);}}
    else if(id===7){if(cur&&cur.length)cur.push([cur[0][0],cur[0][1]]);}
    else throw new Error('mvt: bad geometry command '+id);}
  return parts;}
function decodeTile(input){
  const u8=input instanceof Uint8Array?input:new Uint8Array(input);
  const r=new Reader(u8),layers={};
  while(r.p<r.n){const tag=r.varint(),f=Math.floor(tag/8),wt=tag%8;
    if(f===3&&wt===2){const lr=new Reader(r.bytes());let name='',extent=4096,keys=[],vals=[],feats=[];
      while(lr.p<lr.n){const t=lr.varint(),ff=Math.floor(t/8),w=t%8;
        if(ff===1&&w===2)name=utf8(lr.bytes());
        else if(ff===2&&w===2)feats.push(lr.bytes());
        else if(ff===3&&w===2)keys.push(utf8(lr.bytes()));
        else if(ff===4&&w===2)vals.push(readValue(lr.bytes()));
        else if(ff===5&&w===0)extent=lr.varint();
        else lr.skip(w);}
      const out=[];
      for(const fb of feats){const ft=readFeature(fb),props={};for(let k=0;k+1<ft.tags.length;k+=2)props[keys[ft.tags[k]]]=vals[ft.tags[k+1]];
        out.push({type:ft.type,props,parts:decodeGeometry(ft.type,ft.geom)});}
      layers[name]={extent,features:out};}
    else r.skip(wt);}
  return {layers};
}

/* ---------------- tile maths ---------------- */
function lngLatToTileXY(lng,lat,z){const n=Math.pow(2,z),s=Math.sin(Math.max(-85.0511,Math.min(85.0511,lat))*Math.PI/180);
  return [(lng+180)/360*n,(0.5-Math.log((1+s)/(1-s))/(4*Math.PI))*n];}
function tileToLngLat(z,tx,ty,px,py,extent){const n=Math.pow(2,z),X=(tx+px/extent)/n,Y=(ty+py/extent)/n;
  return [X*360-180,Math.atan(Math.sinh(Math.PI*(1-2*Y)))*180/Math.PI];}
function tilesForBBox(bbox,z){ // bbox [west,south,east,north]
  const a=lngLatToTileXY(bbox[0],bbox[3],z),b=lngLatToTileXY(bbox[2],bbox[1],z),max=Math.pow(2,z)-1,out=[];
  const x0=Math.max(0,Math.floor(a[0])),x1=Math.min(max,Math.floor(b[0])),y0=Math.max(0,Math.floor(a[1])),y1=Math.min(max,Math.floor(b[1]));
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++)out.push({z,x,y});
  return out;
}

/* ---------------- frame: the page grid <-> lng/lat (same formulas as the page) ---------------- */
function makeFrame(lng0,lat0,GW,GH,cellM){
  const mLng=M_PER_DEG*Math.max(0.05,Math.cos(lat0*Math.PI/180)),mLat=M_PER_DEG,dLng=cellM/mLng,dLat=cellM/mLat;
  const W=lng0-(GW/2+0.5)*dLng,N=lat0+(GH/2+0.5)*dLat;
  return {lng0,lat0,GW,GH,cellM,mLng,mLat,
    toGrid:(lng,lat)=>[(lng-lng0)*mLng/cellM+GW/2,GH/2-(lat-lat0)*mLat/cellM],
    toLngLat:(gx,gy)=>[lng0+(gx-GW/2)*cellM/mLng,lat0-(gy-GH/2)*cellM/mLat],
    toMeters:(lng,lat)=>[(lng-lng0)*mLng,(lat-lat0)*mLat],
    // the engine maps sample i to W+(i+0.5)*cell; shifting its bbox by half a cell makes that identical to the page mapping
    engineBBox:[W,N-GH*dLat,W+GW*dLng,N]};
}

/* ---------------- rasterising vector geometry onto the grid ---------------- */
function markDisk(mask,GW,GH,cx,cy,r){const x0=Math.max(0,Math.floor(cx-r)),x1=Math.min(GW-1,Math.ceil(cx+r)),y0=Math.max(0,Math.floor(cy-r)),y1=Math.min(GH-1,Math.ceil(cy+r)),r2=r*r;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const dx=x-cx,dy=y-cy;if(dx*dx+dy*dy<=r2+0.25)mask[y*GW+x]=1;}}
function rasterLine(mask,GW,GH,pts,rCells){ // pts in grid coords
  const r=Math.max(0.5,rCells);
  for(let i=0;i<pts.length;i++){
    if(i===0){markDisk(mask,GW,GH,pts[0][0],pts[0][1],r);continue;}
    const a=pts[i-1],b=pts[i],len=Math.hypot(b[0]-a[0],b[1]-a[1]),steps=Math.max(1,Math.ceil(len/0.25));
    for(let k=1;k<=steps;k++)markDisk(mask,GW,GH,a[0]+(b[0]-a[0])*k/steps,a[1]+(b[1]-a[1])*k/steps,r);
  }
}
function pointInRingsEvenOdd(x,y,rings){let inside=false;
  for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];
    if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;}
  return inside;}
function rasterPolygon(mask,GW,GH,rings){ // rings in grid coords, even-odd fill; conservative: a cell is marked if any of 9 sub-samples is inside, and every ring edge is marked
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const ring of rings)for(const p of ring){if(p[0]<minX)minX=p[0];if(p[0]>maxX)maxX=p[0];if(p[1]<minY)minY=p[1];if(p[1]>maxY)maxY=p[1];}
  if(!(maxX>=minX))return;
  const x0=Math.max(0,Math.floor(minX-1)),x1=Math.min(GW-1,Math.ceil(maxX+1)),y0=Math.max(0,Math.floor(minY-1)),y1=Math.min(GH-1,Math.ceil(maxY+1));
  const offs=[-0.5,0,0.5];
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){let hit=false;
    for(let a=0;a<3&&!hit;a++)for(let b=0;b<3&&!hit;b++)if(pointInRingsEvenOdd(x+offs[a],y+offs[b],rings))hit=true;
    if(hit)mask[y*GW+x]=1;}
  for(const ring of rings)rasterLine(mask,GW,GH,ring,0.5);
}

/* ---------------- exact geometry (metres) ---------------- */
function segDist(ax,ay,bx,by,cx,cy,dx,dy){ // minimum distance between segments ab and cd
  const o=(px,py,qx,qy,rx,ry)=>(qx-px)*(ry-py)-(qy-py)*(rx-px);
  const d1=o(ax,ay,bx,by,cx,cy),d2=o(ax,ay,bx,by,dx,dy),d3=o(cx,cy,dx,dy,ax,ay),d4=o(cx,cy,dx,dy,bx,by);
  if(((d1>0&&d2<0)||(d1<0&&d2>0))&&((d3>0&&d4<0)||(d3<0&&d4>0)))return 0;
  const pd=(px,py,x1,y1,x2,y2)=>{const vx=x2-x1,vy=y2-y1,L=vx*vx+vy*vy;let t=L?((px-x1)*vx+(py-y1)*vy)/L:0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(x1+t*vx),py-(y1+t*vy));};
  return Math.min(pd(ax,ay,cx,cy,dx,dy),pd(bx,by,cx,cy,dx,dy),pd(cx,cy,ax,ay,bx,by),pd(dx,dy,ax,ay,bx,by));
}
function polyBBox(pts){let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity;for(const p of pts){if(p[0]<a)a=p[0];if(p[0]>c)c=p[0];if(p[1]<b)b=p[1];if(p[1]>d)d=p[1];}return [a,b,c,d];}
function bboxGap(a,b){const dx=Math.max(0,a[0]-b[2],b[0]-a[2]),dy=Math.max(0,a[1]-b[3],b[1]-a[3]);return Math.hypot(dx,dy);}
function lineToLineDist(A,B,stopBelow){ // A,B arrays of [x,y] metres
  let m=Infinity;
  for(let i=1;i<A.length;i++){const ax=A[i-1][0],ay=A[i-1][1],bx=A[i][0],by=A[i][1];
    for(let j=1;j<B.length;j++){const d=segDist(ax,ay,bx,by,B[j-1][0],B[j-1][1],B[j][0],B[j][1]);if(d<m){m=d;if(m<=stopBelow)return m;}}}
  if(A.length===1&&B.length>=2){for(let j=1;j<B.length;j++){const d=segDist(A[0][0],A[0][1],A[0][0],A[0][1],B[j-1][0],B[j-1][1],B[j][0],B[j][1]);if(d<m)m=d;}}
  return m;
}
function distToPolygon(A,rings,stopBelow){ // A: swale polyline (metres); rings in metres; 0 when any vertex is inside
  for(const p of A)if(pointInRingsEvenOdd(p[0],p[1],rings))return 0;
  let m=Infinity;for(const ring of rings){const d=lineToLineDist(A,ring,stopBelow);if(d<m)m=d;if(m<=stopBelow)return m;}return m;
}

/* ---------------- classify decoded tile features into exclusion geometry (lng/lat) ---------------- */
function classify(tile,z,tx,ty,roi){ // roi [west,south,east,north] only for counting what falls inside the area of interest
  const out={lines:[],polys:[],counts:{roads:0,buildings:0,parking:0,aeroway:0,water:0,waterways:0,wetlands:0}};
  const toLL=(layer,pt)=>tileToLngLat(z,tx,ty,pt[0],pt[1],layer.extent);
  const inRoi=pts=>{const b=polyBBox(pts);return !(b[2]<roi[0]||b[0]>roi[2]||b[3]<roi[1]||b[1]>roi[3]);};
  const addLines=(layer,f,kind,halfWidthM,requiredM,cls,countKey)=>{for(const part of f.parts){if(part.length<2)continue;const c=part.map(p=>toLL(layer,p));
      out.lines.push({kind,cls,halfWidthM,requiredM,coords:c});if(inRoi(c))out.counts[countKey]++;}};
  const addPolys=(layer,f,kind,requiredM,cls,countKey)=>{const rings=f.parts.filter(p=>p.length>=4).map(p=>p.map(q=>toLL(layer,q)));if(!rings.length)return;
      out.polys.push({kind,cls,requiredM,rings});if(rings.some(inRoi))out.counts[countKey]++;};
  const L=tile.layers;
  if(L.road)for(const f of L.road.features){const cls=String(f.props.class||''),type=String(f.props.type||''),st=String(f.props.structure||'');
    if(SKIP_ROAD_CLASSES[cls]||st==='tunnel')continue;
    const hw=(type==='driveway'||type==='parking_aisle'||type==='alley')?3:(ROAD_HALF_WIDTH_M[cls]!=null?ROAD_HALF_WIDTH_M[cls]:ROAD_DEFAULT_HALF_WIDTH_M);
    if(f.type===2)addLines(L.road,f,'built',hw,hw+SETBACK.builtM,cls||'road','roads');
    else if(f.type===3)addPolys(L.road,f,'built',SETBACK.builtM,cls||'road','roads');}
  if(L.building)for(const f of L.building.features){if(f.type===3)addPolys(L.building,f,'built',SETBACK.builtM,'building','buildings');}
  if(L.landuse)for(const f of L.landuse.features){if(f.type===3&&String(f.props.class||'')==='parking')addPolys(L.landuse,f,'built',SETBACK.builtM,'parking','parking');}
  if(L.aeroway)for(const f of L.aeroway.features){const t=String(f.props.type||'');
    if(f.type===2){const hw=t==='runway'?20:10;addLines(L.aeroway,f,'built',hw,hw+SETBACK.builtM,'aeroway:'+t,'aeroway');}
    else if(f.type===3)addPolys(L.aeroway,f,'built',SETBACK.builtM,'aeroway:'+t,'aeroway');}
  if(L.water)for(const f of L.water.features){if(f.type===3)addPolys(L.water,f,'water',SETBACK.waterM,'water','water');}
  if(L.waterway)for(const f of L.waterway.features){const cls=String(f.props.class||''),hw=WATERWAY_HALF_WIDTH_M[cls]!=null?WATERWAY_HALF_WIDTH_M[cls]:1;
    if(f.type===2)addLines(L.waterway,f,'water',hw,hw+SETBACK.waterM,cls||'waterway','waterways');}
  if(L.landuse_overlay)for(const f of L.landuse_overlay.features){if(f.type===3&&WETLAND_CLASSES[String(f.props.class||'')])addPolys(L.landuse_overlay,f,'water',SETBACK.waterM,'wetland','wetlands');}
  return out;
}

/* ---------------- acquisition ---------------- */
/* opts: {frame, insideMask, fetchTile(z,x,y)->Promise<ArrayBuffer|Uint8Array>, zoom=15, marginM=60, extra:{lines,polys}} ->
   {ok, status:'features-found'|'screened-clear'|'failed', reason, built, water, geometry:{lines,polys}, counts, tiles:[{z,x,y,bytes,layers}], sourceTier} */
async function acquireExclusions(opts){
  const fr=opts.frame,GW=fr.GW,GH=fr.GH,z=opts.zoom||15,margin=opts.marginM==null?60:opts.marginM,inside=opts.insideMask;
  const fail=(reason,tiles)=>({ok:false,status:'failed',reason,built:null,water:null,geometry:null,counts:null,tiles:tiles||[],sourceTier:'none'});
  if(!inside||inside.length!==GW*GH||typeof opts.fetchTile!=='function')return fail('inputs-missing');
  let x0=GW,x1=-1,y0=GH,y1=-1;for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(inside[y*GW+x]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}
  if(x1<0)return fail('empty-boundary');
  const mc=margin/fr.cellM,nw=fr.toLngLat(x0-mc,y0-mc),se=fr.toLngLat(x1+mc,y1+mc);
  const roi=[nw[0],se[1],se[0],nw[1]];
  const tiles=tilesForBBox(roi,z),tileInfo=[];
  if(!tiles.length)return fail('no-tiles');
  const lines=[],polys=[],counts={roads:0,buildings:0,parking:0,aeroway:0,water:0,waterways:0,wetlands:0};
  for(const t of tiles){
    let buf;
    try{buf=await opts.fetchTile(t.z,t.x,t.y);}catch(e){return fail('tile-request-failed:'+t.z+'/'+t.x+'/'+t.y+':'+String(e&&e.message||e),tileInfo);}
    if(!buf||!(buf.byteLength>=0)||buf.byteLength===0)return fail('tile-empty-response:'+t.z+'/'+t.x+'/'+t.y,tileInfo); // an empty reply is "unknown", never "clear"
    let dec;
    try{dec=decodeTile(buf);}catch(e){return fail('tile-undecodable:'+t.z+'/'+t.x+'/'+t.y+':'+String(e&&e.message||e),tileInfo);}
    const layerNames=Object.keys(dec.layers);
    tileInfo.push({z:t.z,x:t.x,y:t.y,bytes:buf.byteLength,layers:layerNames.length});
    if(!layerNames.length)return fail('tile-no-layers:'+t.z+'/'+t.x+'/'+t.y,tileInfo);
    const c=classify(dec,t.z,t.x,t.y,roi);
    for(const l of c.lines)lines.push(l);for(const p of c.polys)polys.push(p);for(const k in counts)counts[k]+=c.counts[k];
  }
  const extra=opts.extra||{};
  for(const l of (extra.lines||[]))lines.push(l);for(const p of (extra.polys||[]))polys.push(p);
  const built=new Uint8Array(GW*GH),water=new Uint8Array(GW*GH);
  for(const l of lines){const g=l.coords.map(c=>fr.toGrid(c[0],c[1]));rasterLine(l.kind==='water'?water:built,GW,GH,g,l.halfWidthM/fr.cellM);}
  for(const p of polys){const rings=p.rings.map(r=>r.map(c=>fr.toGrid(c[0],c[1]))),tgt=p.kind==='water'?water:built;rasterPolygon(tgt,GW,GH,rings);
    if(p.rasterBufferM>0)for(const ring of rings)rasterLine(tgt,GW,GH,ring,p.rasterBufferM/fr.cellM);} // authoritative footprints: page clearance beyond the engine's own 10 ft
  const extraCount=(extra.lines||[]).length+(extra.polys||[]).length;
  const found=counts.roads+counts.buildings+counts.parking+counts.aeroway+counts.water+counts.waterways+counts.wetlands+extraCount;
  counts.extra=extraCount;
  return {ok:true,status:found>0?'features-found':'screened-clear',reason:null,built,water,geometry:{lines,polys},counts,tiles:tileInfo,
    sourceTier:(opts.sourceTier||'open-data'),roi,zoom:z};
}

/* ---------------- exact audit of proposed swales ---------------- */
/* swales: GeoJSON Feature[] (LineString). geometry: {lines,polys} from acquireExclusions. boundary: ring [[lng,lat]...] or null.
   Returns {kept:Feature[], rejected:[{id,reason,kind,clearanceM,requiredM}], minClearanceM:{built,water,boundary}, checked} */
function auditSwales(swales,geometry,boundary,frame){
  const toM=c=>frame.toMeters(c[0],c[1]);
  const lines=(geometry&&geometry.lines||[]).map(l=>({kind:l.kind,cls:l.cls,req:l.requiredM,m:l.coords.map(toM)}));
  const polys=(geometry&&geometry.polys||[]).map(p=>({kind:p.kind,cls:p.cls,req:p.requiredM,rings:p.rings.map(r=>r.map(toM))}));
  for(const l of lines)l.bb=polyBBox(l.m);for(const p of polys){p.bb=polyBBox([].concat(...p.rings));}
  let ring=boundary&&boundary.length>=3?boundary.map(toM):null;
  if(ring&&(ring[0][0]!==ring[ring.length-1][0]||ring[0][1]!==ring[ring.length-1][1]))ring.push(ring[0].slice()); // close the ring so the last edge is measured too
  if(ring&&ring.length<4)ring=null;
  const kept=[],rejected=[],minC={built:Infinity,water:Infinity,boundary:Infinity};
  for(const s of swales){
    const A=s.geometry.coordinates.map(toM),bb=polyBBox(A),id=s.properties&&s.properties.id;let bad=null;
    for(const l of lines){if(bboxGap(bb,l.bb)>l.req+1)continue;const c=lineToLineDist(A,l.m,l.req-1e-6);
      if(c<minC[l.kind==='water'?'water':'built'])minC[l.kind==='water'?'water':'built']=c;
      if(c<l.req-1e-6){bad={reason:l.kind==='water'?'R7':'R6',kind:'line:'+l.cls,clearanceM:+c.toFixed(2),requiredM:+l.req.toFixed(2)};break;}}
    if(!bad)for(const p of polys){if(bboxGap(bb,p.bb)>p.req+1)continue;const d=distToPolygon(A,p.rings,p.req-1e-6);
      if(d<minC[p.kind==='water'?'water':'built'])minC[p.kind==='water'?'water':'built']=d;
      if(d<p.req-1e-6){bad={reason:p.kind==='water'?'R7':'R6',kind:'polygon:'+p.cls,clearanceM:+d.toFixed(2),requiredM:+p.req.toFixed(2)};break;}}
    if(!bad&&ring){let inside=true,dmin=Infinity;
      for(const p of A){if(!pointInRingsEvenOdd(p[0],p[1],[ring])){inside=false;break;}}
      if(inside)dmin=lineToLineDist(A,ring,SETBACK.builtM-1e-6);
      if(dmin<minC.boundary)minC.boundary=dmin;
      if(!inside)bad={reason:'R9',kind:'boundary',clearanceM:0,requiredM:0};
      else if(dmin<SETBACK.builtM-1e-6)bad={reason:'R6',kind:'property-line',clearanceM:+dmin.toFixed(2),requiredM:SETBACK.builtM};}
    if(bad){rejected.push(Object.assign({id},bad));}else kept.push(s);
  }
  const r=v=>Number.isFinite(v)?+v.toFixed(2):null;
  return {kept,rejected,minClearanceM:{built:r(minC.built),water:r(minC.water),boundary:r(minC.boundary)},checked:swales.length,
    counts:{lines:lines.length,polygons:polys.length}};
}

/* ---------------- engine output -> page corridor objects ---------------- */
function toCorridors(swales,frame){
  const maxCap=Math.max(1,...swales.map(s=>s.properties.capture_score||0));
  return swales.map((s,i)=>{const p=s.properties,pts=s.geometry.coordinates.map(c=>frame.toGrid(c[0],c[1]));
    const capCells=(p.capture_score/(frame.cellM*frame.cellM))*s.geometry.coordinates.length; // sum of contributing area (cells) along the line
    return {pts,capCells,lenM:p.length_m,slope:p.mean_slope_pct,canopy:0,forested:false,kind:'contour',band:i,
      score:0.2+0.8*((p.capture_score||0)/maxCap),isSite:false,
      slopeScore:1,breakScore:0,catchScore:Math.min(1,capCells/4000),percScore:0.5,impOn:0,impUp:0,
      id:p.id,stableId:p.id,levelH:p.elevation_m,engine:p,engineVersion:'earthline-property-swales',source:'EarthlinePropertySwales'};});
}

const api={VERSION,SETBACK,ROAD_HALF_WIDTH_M,decodeTile,tilesForBBox,tileToLngLat,lngLatToTileXY,makeFrame,rasterLine,rasterPolygon,
  acquireExclusions,auditSwales,toCorridors,classify,_internal:{segDist,lineToLineDist,distToPolygon,pointInRingsEvenOdd}};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.EarthlineSwaleBridge=api;
})(typeof window!=='undefined'?window:globalThis);
