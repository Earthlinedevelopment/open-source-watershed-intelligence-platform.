'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const B=require('../earthline-property-swale-bridge.js'),E=require('../earthline-property-swales.js');
const FX=path.join(__dirname,'fixtures'),fx=JSON.parse(fs.readFileSync(path.join(FX,'fixture.json'))),tile=fs.readFileSync(path.join(FX,'tile.pbf')),tileEmpty=fs.readFileSync(path.join(FX,'tile-empty-layer.pbf'));
const results=[];const T=async(name,fn)=>{try{await fn();results.push('PASS  '+name);}catch(e){results.push('FAIL  '+name+' — '+(e&&e.stack||e));}};
const GW=210,GH=146,CELL=5,[lng0,lat0]=fx.center,frame=B.makeFrame(lng0,lat0,GW,GH,CELL);
const inside=new Uint8Array(GW*GH);for(let y=44;y<102;y++)for(let x=76;x<134;x++)inside[y*GW+x]=1; // 58x58 cells = 290 m square around the centre
const ringLL=()=>{const c=[[75.5,43.5],[133.5,43.5],[133.5,101.5],[75.5,101.5],[75.5,43.5]];return c.map(p=>frame.toLngLat(p[0],p[1]));};
const okFetch=async(z,x,y)=>{assert.deepStrictEqual([z,x,y],[fx.z,fx.x,fx.y],'unexpected tile '+[z,x,y]);return tile.buffer.slice(tile.byteOffset,tile.byteOffset+tile.byteLength);};
const m2=(a,b)=>Math.hypot((a[0]-b[0])*frame.mLng,(a[1]-b[1])*frame.mLat);

(async()=>{
await T('decoder reads every layer, type, property and coordinate of the independently built tile',()=>{
  const d=B.decodeTile(tile);
  assert.deepStrictEqual(Object.keys(d.layers).sort(),Object.keys(fx.features).sort());
  for(const [name,list] of Object.entries(fx.features)){
    const L=d.layers[name];assert.equal(L.extent,fx.extent);assert.equal(L.features.length,list.length,name);
    list.forEach((exp,i)=>{const got=L.features[i];assert.equal(got.type,exp.type);
      for(const [k,v] of Object.entries(exp.props))assert.strictEqual(got.props[k],v,name+'.'+k);
      exp.lnglat.forEach((part,pi)=>{part.forEach((ll,k)=>{const g=B.tileToLngLat(fx.z,fx.x,fx.y,got.parts[pi][k][0],got.parts[pi][k][1],fx.extent);
        assert(m2(g,ll)<0.5,name+' vertex off by '+m2(g,ll).toFixed(3)+' m');});});});
  }
  results.push('      decoded '+Object.values(d.layers).reduce((a,l)=>a+l.features.length,0)+' features in '+Object.keys(d.layers).length+' layers');
});
await T('truncated and garbage tiles throw (never decode to "nothing")',()=>{
  assert.throws(()=>B.decodeTile(tile.subarray(0,tile.length-7)));
  assert.throws(()=>B.decodeTile(new Uint8Array([0x1f,0x8b,8,0,0,0,0,0,0,3,1,2,3])));
});
await T('tiles for the property area (centre of tile = 1 tile; corner = 4 tiles)',()=>{
  const c=B.tilesForBBox([lng0-0.0004,lat0-0.0004,lng0+0.0004,lat0+0.0004],15);assert.equal(c.length,1);
  const n=Math.pow(2,15),cornerLng=(fx.x)/n*360-180,cornerLat=Math.atan(Math.sinh(Math.PI*(1-2*fx.y/n)))*180/Math.PI;
  assert.equal(B.tilesForBBox([cornerLng-0.0004,cornerLat-0.0004,cornerLng+0.0004,cornerLat+0.0004],15).length,4);
});
await T('frame: engine sample positions equal the page grid positions (half-cell bbox shift)',()=>{
  const bb=frame.engineBBox,w=GW,h=GH;
  for(const [gx,gy] of [[0,0],[10,20],[105,73],[209,145]]){
    const eng=[bb[0]+(gx+0.5)/w*(bb[2]-bb[0]),bb[3]-(gy+0.5)/h*(bb[3]-bb[1])],page=frame.toLngLat(gx,gy);
    assert(m2(eng,page)<0.001,'off by '+m2(eng,page));const back=frame.toGrid(page[0],page[1]);assert(Math.abs(back[0]-gx)<1e-6&&Math.abs(back[1]-gy)<1e-6);}
});
let acq;
await T('acquire: all tiles decoded, features found, masks marked where the roads, building, water are',async()=>{
  acq=await B.acquireExclusions({frame,insideMask:inside,fetchTile:okFetch});
  assert(acq.ok,acq.reason);assert.equal(acq.status,'features-found');
  const c=acq.counts;assert(c.roads>=2&&c.buildings===1&&c.parking===1&&c.water===1&&c.waterways===1&&c.wetlands===1,JSON.stringify(c));
  assert.equal(c.aeroway,0);
  const at=(e,n)=>{const g=frame.toGrid(...[lng0+e/frame.mLng,lat0+n/frame.mLat]);return [Math.round(g[0]),Math.round(g[1])];};
  const [rx,ry]=at(0,-120),[bx,by]=at(66,26),[wx,wy]=at(-220,115),[sx,sy]=at(150,-100),[px,py]=at(0,170),[ox,oy]=at(0,0);
  assert(acq.built[ry*GW+rx]&&acq.built[by*GW+bx]);assert(acq.water[wy*GW+wx]&&acq.water[sy*GW+sx]&&acq.water[py*GW+px]);
  assert(!acq.built[oy*GW+ox]&&!acq.water[oy*GW+ox],'open ground must stay unmarked');
  const [tx0,ty0]=at(0,300);assert(!acq.built[ty0*GW+tx0],'tunnel must be ignored');const [fx0,fy0]=at(0,320);assert(!acq.built[fy0*GW+fx0],'ferry must be ignored');
  results.push('      '+JSON.stringify(c)+' built cells '+acq.built.reduce((a,b)=>a+b,0)+' water cells '+acq.water.reduce((a,b)=>a+b,0));
});
await T('acquire: tile with a layer but no features everywhere -> screened-clear (the only way to say "clear")',async()=>{
  const o=await B.acquireExclusions({frame,insideMask:inside,fetchTile:async()=>tileEmpty.buffer.slice(tileEmpty.byteOffset,tileEmpty.byteOffset+tileEmpty.byteLength)});
  assert(o.ok);assert.equal(o.status,'screened-clear');assert.equal(o.built.reduce((a,b)=>a+b,0),0);
});
await T('acquire fails closed: request error, empty reply, undecodable reply, no layers',async()=>{
  const cases={'tile-request-failed':async()=>{throw new Error('HTTP 429');},'tile-empty-response':async()=>new ArrayBuffer(0),
    'tile-undecodable':async()=>new Uint8Array([0x1a,0xff,0xff,0xff,0xff,0xff]).buffer,'tile-no-layers':async()=>new Uint8Array([0x08,0x01]).buffer};
  for(const [k,f] of Object.entries(cases)){const o=await B.acquireExclusions({frame,insideMask:inside,fetchTile:f});assert.equal(o.ok,false,k);assert.equal(o.status,'failed');assert(o.reason.startsWith(k),k+' got '+o.reason);assert.equal(o.built,null);}
  const o=await B.acquireExclusions({frame,insideMask:inside,fetchTile:null});assert.equal(o.ok,false);
});
await T('audit: crossing a road, 2 m from the building, 10 m from the stream, inside the pond buffer are all rejected; clear ground kept',()=>{
  const sw=(id,a,b)=>({type:'Feature',properties:{id},geometry:{type:'LineString',coordinates:[[lng0+a[0]/frame.mLng,lat0+a[1]/frame.mLat],[lng0+b[0]/frame.mLng,lat0+b[1]/frame.mLat]]}});
  const list=[sw('cross-road',[-30,-150],[-30,-90]),sw('near-building',[58,22],[58,30]),sw('near-stream',[140,-20],[140,40]),sw('in-pond-buffer',[-230,100],[-200,100]),
    sw('driveway',[-62,-100],[-62,-60]),sw('clear',[-100,0],[-20,0]),sw('wetland-buffer',[-20,120],[-20,140])];
  const a=B.auditSwales(list,acq.geometry,ringLL(),frame);
  const rej=Object.fromEntries(a.rejected.map(r=>[r.id,r]));
  for(const id of ['cross-road','near-building','near-stream','in-pond-buffer','driveway','wetland-buffer'])assert(rej[id],id+' should be rejected');
  assert.equal(rej['cross-road'].reason,'R6');assert.equal(rej['near-stream'].reason,'R7');assert.equal(rej['in-pond-buffer'].reason,'R7');
  assert.deepStrictEqual(a.kept.map(s=>s.properties.id),['clear']);
  results.push('      rejected '+a.rejected.map(r=>r.id+'('+r.reason+' '+r.clearanceM+'/'+r.requiredM+' m)').join(', '));
});
await T('audit: outside the property boundary or within 10 ft of the line is rejected',()=>{
  const sw=(id,a,b)=>({type:'Feature',properties:{id},geometry:{type:'LineString',coordinates:[[lng0+a[0]/frame.mLng,lat0+a[1]/frame.mLat],[lng0+b[0]/frame.mLng,lat0+b[1]/frame.mLat]]}});
  const none={lines:[],polys:[]};
  const a=B.auditSwales([sw('out',[-300,0],[-200,0]),sw('edge',[-146,0],[-100,0]),sw('in',[-100,10],[-20,10])],none,ringLL(),frame);
  const r=Object.fromEntries(a.rejected.map(x=>[x.id,x.reason]));assert.equal(r.out,'R9');assert.equal(r.edge,'R6');assert.deepStrictEqual(a.kept.map(s=>s.properties.id),['in']);
});
await T('end to end: engine on gentle land with the decoded exclusions; the exact audit independently finds nothing wrong',async()=>{
  const e=new Float32Array(GW*GH);for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)e[y*GW+x]=100-y*CELL*0.02+0.05*Math.sin(x/9);
  const flow=new Float32Array(GW*GH).fill(1);
  const out=E.run({grid:{w:GW,h:GH,cellM:CELL,bbox:frame.engineBBox,elev:e},inside,exclusions:{status:acq.status,sourceTier:acq.sourceTier,built:acq.built,water:acq.water},
    soilGroup:null,elevationSource:'test',flowAccumulation:flow,channelThresholdCells:1e9});
  assert(out.swales.length>0,'no swales: '+out.message);
  const a=B.auditSwales(out.swales,acq.geometry,ringLL(),frame);
  // independent check by dense sampling (different method from the exact segment distances)
  const need=[];for(const l of acq.geometry.lines)need.push({req:l.requiredM,pts:l.coords.map(c=>frame.toMeters(c[0],c[1])),line:true});
  let worst=Infinity,viol=0;
  for(const s of a.kept){const P=s.geometry.coordinates.map(c=>frame.toMeters(c[0],c[1]));
    for(let i=1;i<P.length;i++){const n=Math.max(1,Math.ceil(Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1])/0.5));
      for(let k=0;k<=n;k++){const px=P[i-1][0]+(P[i][0]-P[i-1][0])*k/n,py=P[i-1][1]+(P[i][1]-P[i-1][1])*k/n;
        for(const f of need){for(let j=1;j<f.pts.length;j++){const vx=f.pts[j][0]-f.pts[j-1][0],vy=f.pts[j][1]-f.pts[j-1][1],L=vx*vx+vy*vy;let t=L?((px-f.pts[j-1][0])*vx+(py-f.pts[j-1][1])*vy)/L:0;t=Math.max(0,Math.min(1,t));
          const d=Math.hypot(px-(f.pts[j-1][0]+t*vx),py-(f.pts[j-1][1]+t*vy));if(d<worst)worst=d;if(d<f.req-0.5)viol++;}}}}}
  assert.equal(viol,0,viol+' dense samples closer than required (-0.5 m tolerance for the 0.5 m sampling)');
  results.push('      engine '+out.swales.length+' swales, exact audit kept '+a.kept.length+' rejected '+a.rejected.length+'; dense-sample closest line distance '+worst.toFixed(1)+' m; min clearances '+JSON.stringify(a.minClearanceM));
});
await T('corridor conversion: grid points round-trip to the same lng/lat; page fields present',()=>{
  const s={type:'Feature',properties:{id:'EL-P-TEST',length_m:30,mean_slope_pct:2.5,elevation_m:99.1,capture_score:1500},geometry:{type:'LineString',coordinates:[[lng0,lat0],[lng0+0.0001,lat0]]}};
  const c=B.toCorridors([s],frame)[0];assert.equal(c.pts.length,2);assert(Math.abs(c.pts[0][0]-GW/2)<1e-6&&Math.abs(c.pts[0][1]-GH/2)<1e-6);
  const back=frame.toLngLat(c.pts[1][0],c.pts[1][1]);assert(Math.abs(back[0]-(lng0+0.0001))<1e-9);assert.equal(c.id,'EL-P-TEST');assert(Number.isFinite(c.capCells)&&Number.isFinite(c.score)&&c.slope===2.5&&c.lenM===30);
});
console.log(results.join('\n'));if(results.some(r=>r.startsWith('FAIL')))process.exit(1);
})();
