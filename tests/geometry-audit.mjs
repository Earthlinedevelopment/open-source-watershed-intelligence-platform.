// Geometry audit of everything Earthline has drawn as a line, measured in metres on the live page.
// Self-contained on purpose: it is serialised into the browser by page.evaluate(), so it may not reference anything outside itself.
//
// What it measures (observations only, no pass/fail judgement beyond the thresholds written below):
//   roadCrossings          drawn line properly crosses a road line from the basemap
//   withinRoadSetback      drawn line comes within 3.05 m (10 ft) of a road line  [spec R6]
//   rulerStraightLong      line >= 100 m long whose largest sideways deviation from a straight chord is <= 1.5 m
//   axisAlignedLong        line >= 100 m long running within 2 degrees of due N-S or E-W
//   tightPairs             two roughly parallel lines (<= 6 deg) closer than `tightM` over >= 10 m  (swales: spec R5 says none closer than 4.572 m)
//   largestTightCluster    most lines chained together by tight pairs ("comb" / "stack")
//   rechargeOverlap        how much of the swale engine's output lies inside the orange MODELED RECHARGE TARGETS the page draws
//                          (from the page's own earthlineRechargeGeoJSON()). Observation only: no rule in R1-R13 covers this.
// Layers audited: every line layer whose id starts with earthline- or el- (water paths, swales, targets ...), plus the
// swale engine's own output (earthlineSwaleGeoJSON). Roads come from the basemap's own road line layers.
// Only features currently rendered in the viewport are seen; run it with the property in view.
export function geometryAudit(){
  try{
    const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
    if(!map||!map.getStyle||!map.queryRenderedFeatures||!map.getCenter)return {ok:false,error:'map query API unavailable'};
    const c=map.getCenter(),R=6371008.8,rad=Math.PI/180,kx=R*Math.cos(c.lat*rad)*rad,ky=R*rad;
    const toM=co=>[(co[0]-c.lng)*kx,(co[1]-c.lat)*ky];
    const toLL=p=>[Math.round((p[0]/kx+c.lng)*1e6)/1e6,Math.round((p[1]/ky+c.lat)*1e6)/1e6];
    const OWN=/^(earthline|el)[-_]/i;
    const styleLayers=(map.getStyle()&&map.getStyle().layers)||[];
    const ownIds=styleLayers.filter(l=>l.type==='line'&&OWN.test(l.id)).map(l=>l.id);
    const roadIds=styleLayers.filter(l=>l.type==='line'&&!OWN.test(l.id)&&
      /(^|[-_])(road|street|bridge|tunnel|motorway|trunk|primary|secondary|tertiary|service|link|track)([-_]|$)/i.test(l.id)&&
      !/label|shield|oneway|arrow|case|rail|ferry|path-pedestrian|steps/i.test(l.id)).map(l=>l.id);
    const linesOf=g=>!g?[]:g.type==='LineString'?[g.coordinates]:g.type==='MultiLineString'?g.coordinates:[];
    const uniq=(feats)=>{const seen=new Set(),o=[];for(const f of feats){const k=JSON.stringify(f.geometry&&f.geometry.coordinates);if(!seen.has(k)){seen.add(k);o.push(f);}}return o;};
    const query=ids=>{if(!ids.length)return [];try{return uniq(map.queryRenderedFeatures({layers:ids}));}catch(_){return [];}};
    const toPolys=feats=>{const o=[];for(const f of feats)for(const ln of linesOf(f.geometry)){if(ln&&ln.length>=2){const m=ln.map(toM);if(m.every(p=>Number.isFinite(p[0])&&Number.isFinite(p[1])))o.push(m);}}return o;};
    const dist=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],L=dx*dx+dy*dy;let t=L?((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L:0;t=Math.max(0,Math.min(1,t));return Math.hypot(p[0]-(a[0]+t*dx),p[1]-(a[1]+t*dy));};
    const ccw=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
    const cross=(a,b,p,q)=>{const d1=ccw(a,b,p),d2=ccw(a,b,q),d3=ccw(p,q,a),d4=ccw(p,q,b);return ((d1>0&&d2<0)||(d1<0&&d2>0))&&((d3>0&&d4<0)||(d3<0&&d4>0));};
    const polyLen=m=>{let s=0;for(let i=1;i<m.length;i++)s+=Math.hypot(m[i][0]-m[i-1][0],m[i][1]-m[i-1][1]);return s;};
    const samples=(m,step)=>{const o=[m[0]];let carry=0;for(let i=1;i<m.length;i++){const a=m[i-1],b=m[i],L=Math.hypot(b[0]-a[0],b[1]-a[1]);let d=step-carry;while(d<=L){const t=d/L;o.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1])]);d+=step;}carry=(carry+L)%step;}o.push(m[m.length-1]);return o;};
    const bbox=(m,pad)=>{let x0=1e18,y0=1e18,x1=-1e18,y1=-1e18;for(const p of m){if(p[0]<x0)x0=p[0];if(p[0]>x1)x1=p[0];if(p[1]<y0)y0=p[1];if(p[1]>y1)y1=p[1];}return [x0-pad,y0-pad,x1+pad,y1+pad];};
    const overlap=(a,b)=>!(a[2]<b[0]||b[2]<a[0]||a[3]<b[1]||b[3]<a[1]);
    const bearing=m=>{const a=m[0],b=m[m.length-1];let d=Math.atan2(b[0]-a[0],b[1]-a[1])/rad;d=((d%180)+180)%180;return d;};
    const angDiff=(a,b)=>{const d=Math.abs(a-b)%180;return Math.min(d,180-d);};

    const roadPolys=toPolys(query(roadIds));
    const roadSegs=[];for(const m of roadPolys)for(let i=1;i<m.length;i++)roadSegs.push([m[i-1],m[i],bbox([m[i-1],m[i]],4)]);
    const roadsUsable=roadSegs.length>0;

    function audit(name,polys,tightM){
      const rec={layer:name,lines:polys.length,totalLengthM:0,rulerStraightLong:0,axisAlignedLong:0,roadCrossings:0,withinRoadSetback:0,tightPairs:0,largestTightCluster:polys.length?1:0,examples:{}};
      const info=polys.map(m=>({m,len:polyLen(m),bb:bbox(m,tightM+1),br:bearing(m)}));
      const note=(k,m,extra)=>{const a=rec.examples[k]||(rec.examples[k]=[]);if(a.length<3){const mid=m[Math.floor((m.length-1)/2)];a.push({near:toLL(mid),...(extra||{})});}};
      for(const o of info){
        rec.totalLengthM+=o.len;
        const a=o.m[0],b=o.m[o.m.length-1],chord=Math.hypot(b[0]-a[0],b[1]-a[1]);
        let dev=0;if(chord>0)for(const p of o.m){const d=Math.abs(ccw(a,b,p))/chord;if(d>dev)dev=d;}
        if(o.len>=100&&dev<=1.5){rec.rulerStraightLong++;note('rulerStraightLong',o.m,{lengthM:Math.round(o.len)});}
        if(o.len>=100&&chord>=0.9*o.len){const br=o.br;if(angDiff(br,0)<=2||angDiff(br,90)<=2){rec.axisAlignedLong++;note('axisAlignedLong',o.m,{lengthM:Math.round(o.len),bearingDeg:Math.round(br*10)/10});}}
        if(roadsUsable){
          let crossed=false,minD=1e9;const sm=samples(o.m,2);
          for(const [r0,r1,rb] of roadSegs){
            if(!overlap(rb,o.bb))continue;
            for(let i=1;i<o.m.length&&!crossed;i++)if(cross(o.m[i-1],o.m[i],r0,r1))crossed=true;
            for(const p of sm){const d=dist(p,r0,r1);if(d<minD)minD=d;}
          }
          if(crossed){rec.roadCrossings++;note('roadCrossings',o.m);}
          if(minD<=3.05){rec.withinRoadSetback++;note('withinRoadSetback',o.m,{closestM:Math.round(minD*10)/10});}
        }
      }
      // tight pairs + clusters (union-find)
      const par=info.map((_,i)=>i),find=i=>{while(par[i]!==i){par[i]=par[par[i]];i=par[i];}return i;};
      for(let i=0;i<info.length;i++){
        for(let j=i+1;j<info.length;j++){
          if(info[i].len<10||info[j].len<10)continue;
          if(!overlap(info[i].bb,info[j].bb))continue;
          if(angDiff(info[i].br,info[j].br)>6)continue;
          const sj=samples(info[j].m,3);let near=0;
          for(const p of sj){let md=1e9;const m=info[i].m;for(let k=1;k<m.length;k++){const d=dist(p,m[k-1],m[k]);if(d<md)md=d;}if(md<tightM)near++;}
          if(near>=4){rec.tightPairs++;par[find(i)]=find(j);if(rec.tightPairs<=3)note('tightPairs',info[i].m,{closerThanM:tightM});}
        }
      }
      const cnt={};let best=0;for(let i=0;i<info.length;i++){const r=find(i);cnt[r]=(cnt[r]||0)+1;if(cnt[r]>best)best=cnt[r];}
      rec.largestTightCluster=best;rec.totalLengthM=Math.round(rec.totalLengthM);
      return rec;
    }

    const layers=[];
    for(const id of ownIds){const polys=toPolys(query([id]));if(polys.length)layers.push(audit(id,polys,3.0));}
    let engineOut=null,swalePolys=[];
    try{const fc=typeof earthlineSwaleGeoJSON==='function'?earthlineSwaleGeoJSON():null;
      swalePolys=toPolys(((fc&&fc.features)||[]).filter(f=>f&&f.geometry));
      if(swalePolys.length)engineOut=audit('SWALE ENGINE OUTPUT (what the page published)',swalePolys,4.572);}catch(_){}
    // Swales vs the orange recharge targets (ellipses the page draws). Point-in-polygon on a sample every 2 m along each swale.
    let rechargeOverlap=null;
    try{
      const rc=typeof earthlineRechargeGeoJSON==='function'?earthlineRechargeGeoJSON():null;
      const rings=[];
      for(const f of ((rc&&rc.features)||[])){const g=f&&f.geometry;if(g&&g.type==='Polygon'&&g.coordinates&&g.coordinates[0]){const r=g.coordinates[0].map(toM);if(r.every(p=>Number.isFinite(p[0])&&Number.isFinite(p[1])))rings.push(r);}}
      if(!rings.length)rechargeOverlap={targets:0,note:'no recharge targets on the page when audited'};
      else{
        const inside=(p,ring)=>{let c=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if(((a[1]>p[1])!==(b[1]>p[1]))&&(p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0]))c=!c;}return c;};
        const area=ring=>{let s=0;for(let i=0,j=ring.length-1;i<ring.length;j=i++)s+=ring[j][0]*ring[i][1]-ring[i][0]*ring[j][1];return Math.abs(s)/2;};
        let total=0,insideLen=0,touching=0;const hit=new Set(),ex=[];
        for(const m of swalePolys){
          const L=polyLen(m);total+=L;const sm=samples(m,2);let n=0;
          for(const p of sm){let any=false;for(let r=0;r<rings.length;r++)if(inside(p,rings[r])){any=true;hit.add(r);}if(any)n++;}
          insideLen+=L*(n/sm.length);
          if(n>0){touching++;if(ex.length<3)ex.push({near:toLL(m[Math.floor((m.length-1)/2)]),sharePctOfThisSwaleInside:Math.round(100*n/sm.length)});}
        }
        rechargeOverlap={targets:rings.length,targetAreaM2:Math.round(rings.reduce((a,r)=>a+area(r),0)),swalesChecked:swalePolys.length,
          swalesTouchingTargets:touching,targetsTouchedBySwales:hit.size,swaleLengthM:Math.round(total),swaleLengthInsideTargetsM:Math.round(insideLen),
          shareOfSwaleLengthInsideTargetsPct:total?Math.round(1000*insideLen/total)/10:0,examples:ex};
      }
    }catch(e){rechargeOverlap={error:String(e&&e.message||e).slice(0,160)};}
    return {ok:true,roadLayersQueried:roadIds.length,roadSegmentsSeen:roadSegs.length,roadCheckValid:roadsUsable,
      thresholds:{roadSetbackM:3.05,swaleMinSpacingM:4.572,otherTightM:3.0,rulerStraightMinLengthM:100,rulerStraightMaxDeviationM:1.5,axisAlignToleranceDeg:2},
      swaleOutput:engineOut,rechargeOverlap,drawnLayers:layers};
  }catch(e){return {ok:false,error:String(e&&e.message||e).slice(0,200)};}
}
