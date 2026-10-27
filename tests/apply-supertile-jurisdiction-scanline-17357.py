from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="    /* EARTHLINE 16841 — GROUPED STATEWIDE-DEM LOCAL PHASE. */"
if s.count(marker)!=1: raise SystemExit(f"supertile marker count {s.count(marker)}")
helpers=r'''    /* EARTHLINE 17357 — exact row-prepared jurisdiction predicate for statewide
       supertile screening. Same boundary-inclusive outer / hole-exclusive rule as
       earthlinePointInJurisdiction16539; only repeated edge evaluation is removed. */
    function earthlineJurisdictionRingRow17357(ring17357,y17357){
      if(!Array.isArray(ring17357)||ring17357.length<3)return null;
      const cuts17357=[],boundary17357=[],horizontal17357=[];
      for(let i17357=0,j17357=ring17357.length-1;i17357<ring17357.length;j17357=i17357++){
        const a17357=ring17357[j17357],b17357=ring17357[i17357];
        if(!earthlineFinitePoint16539(a17357)||!earthlineFinitePoint16539(b17357))continue;
        const x117357=Number(a17357[0]),y117357=Number(a17357[1]),x217357=Number(b17357[0]),y217357=Number(b17357[1]),
              dx17357=x217357-x117357,dy17357=y217357-y117357;
        if(((y217357>y17357)!==(y117357>y17357)))
          cuts17357.push((x117357-x217357)*(y17357-y217357)/((y117357-y217357)||1e-15)+x217357);
        if(Math.abs(dy17357)>1e-20){
          const t17357=(y17357-y117357)/dy17357;
          if(t17357>=0&&t17357<=1){
            const xb17357=x117357+dx17357*t17357,tol17357=1e-10/Math.max(Math.abs(dy17357),1e-20);
            boundary17357.push([xb17357,tol17357,t17357]);
          }
        }else if(Math.abs((y17357-y117357)*dx17357)<=1e-10){
          horizontal17357.push([Math.min(x117357,x217357),Math.max(x117357,x217357)]);
        }
      }
      cuts17357.sort((a17357,b17357)=>a17357-b17357);
      boundary17357.sort((a17357,b17357)=>a17357[0]-b17357[0]);
      return {cuts:cuts17357,boundary:boundary17357,horizontal:horizontal17357};
    }
    function earthlineJurisdictionRingRowInside17357(x17357,row17357){
      if(!row17357)return {inside:false,boundary:false};
      for(const h17357 of row17357.horizontal)if(x17357>=h17357[0]&&x17357<=h17357[1])return {inside:false,boundary:true};
      const b17357=row17357.boundary;
      let loB17357=0,hiB17357=b17357.length;
      while(loB17357<hiB17357){const m17357=(loB17357+hiB17357)>>1;if(b17357[m17357][0]<x17357)loB17357=m17357+1;else hiB17357=m17357;}
      for(const k17357 of [loB17357-1,loB17357,loB17357+1]){
        if(k17357<0||k17357>=b17357.length)continue;
        const q17357=b17357[k17357],tol17357=q17357[1];
        if(Math.abs(x17357-q17357[0])<=tol17357)return {inside:false,boundary:true};
      }
      const cuts17357=row17357.cuts;let lo17357=0,hi17357=cuts17357.length;
      while(lo17357<hi17357){const m17357=(lo17357+hi17357)>>1;if(cuts17357[m17357]<=x17357)lo17357=m17357+1;else hi17357=m17357;}
      return {inside:((cuts17357.length-lo17357)&1)===1,boundary:false};
    }
    function earthlinePrepareJurisdictionRow17357(g17357,y17357){
      const prepared17357=earthlinePrepareJurisdiction16539(g17357);if(!prepared17357)return null;
      const polygons17357=[];
      for(const poly17357 of (prepared17357.polygons||[])){
        if(!poly17357||!poly17357.bbox||y17357<poly17357.bbox[1]||y17357>poly17357.bbox[3])continue;
        const outer17357=earthlineJurisdictionRingRow17357(poly17357.outer,y17357),holes17357=[];
        for(const h17357 of (poly17357.holes||[])){
          if(!h17357||!h17357.bbox||y17357<h17357.bbox[1]||y17357>h17357.bbox[3])continue;
          holes17357.push({bbox:h17357.bbox,row:earthlineJurisdictionRingRow17357(h17357.ring,y17357)});
        }
        polygons17357.push({bbox:poly17357.bbox,outer:outer17357,holes:holes17357});
      }
      return {y:y17357,polygons:polygons17357};
    }
    function earthlinePointInJurisdictionRow17357(p17357,row17357,g17357){
      if(!earthlineFinitePoint16539(p17357)||!row17357)return false;
      const x17357=Number(p17357[0]);
      for(const poly17357 of row17357.polygons){
        if(x17357<poly17357.bbox[0]||x17357>poly17357.bbox[2])continue;
        const outer17357=earthlineJurisdictionRingRowInside17357(x17357,poly17357.outer);
        if(outer17357.boundary)return earthlinePointInJurisdiction16539(p17357,g17357);
        if(!outer17357.inside)continue;
        let inHole17357=false;
        for(const h17357 of poly17357.holes){
          if(x17357<h17357.bbox[0]||x17357>h17357.bbox[2])continue;
          const hole17357=earthlineJurisdictionRingRowInside17357(x17357,h17357.row);
          if(hole17357.boundary)return earthlinePointInJurisdiction16539(p17357,g17357);
          if(hole17357.inside){inHole17357=true;break;}
        }
        if(!inHole17357)return true;
      }
      return false;
    }

'''
s=s.replace(marker,helpers+marker,1)
old="""      const start16839=performance.now(),N16839=24,groupSize16839=6,channel16839=percentile(hy.acc,.972),rows16839=[];
      for(let by16839=0;by16839<N16839;by16839++)for(let bx16839=0;bx16839<N16839;bx16839++){"""
new="""      const start16839=performance.now(),N16839=24,groupSize16839=6,channel16839=percentile(hy.acc,.972),rows16839=[];
      const jurisdictionRows17357=swaleJurisdictionGeometry16539
        ?Array.from({length:hy.h},(_,y17357)=>earthlinePrepareJurisdictionRow17357(swaleJurisdictionGeometry16539,gridLL(hy,0,y17357)[1]))
        :null;
      for(let by16839=0;by16839<N16839;by16839++)for(let bx16839=0;bx16839<N16839;bx16839++){"""
if s.count(old)!=1: raise SystemExit(f"supertile start anchor count {s.count(old)}")
s=s.replace(old,new,1)
old2="""          if(swaleJurisdictionGeometry16539){const ll16839=gridLL(hy,x16839,y16839);if(!earthlinePointInJurisdiction16539(ll16839,swaleJurisdictionGeometry16539))continue;}"""
new2="""          if(swaleJurisdictionGeometry16539){const ll16839=gridLL(hy,x16839,y16839);if(!earthlinePointInJurisdictionRow17357(ll16839,jurisdictionRows17357&&jurisdictionRows17357[y16839],swaleJurisdictionGeometry16539))continue;}"""
if s.count(old2)!=1: raise SystemExit(f"supertile jurisdiction cell anchor count {s.count(old2)}")
s=s.replace(old2,new2,1)
s="<!-- EARTHLINE_SUPERTILE_JURISDICTION_SCANLINE_17357: exact row-prepared administrative predicate for 16841 pre-scan; science, boundary, ranking, spacing and capacity unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed exact supertile jurisdiction row predicate 17357")
