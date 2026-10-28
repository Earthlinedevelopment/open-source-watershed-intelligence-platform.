from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old='''  function spacingStats(swales){
    const list=(swales||[]).filter(s=>s&&s.pts&&s.pts.length>1);
    const sample=earthlineDeterministicSpacingSample15770(list,64);
    const nearest=[];
    for(const subject of sample){
      let best=Infinity;
      for(const other of list){
        if(subject===other)continue;
        if(subject.bandKey!=null&&other.bandKey!=null&&subject.bandKey===other.bandKey)continue;
        if(earthlineBBoxGapM15770(subject,other)>=best)continue;
        const d=earthlinePathDistanceFast15770(subject,other,best);
        if(d<best)best=d;
      }
      if(Number.isFinite(best))nearest.push(best);
    }
    nearest.sort((a,b)=>a-b);
    return {
      populationCount:list.length,
      sampleCount:nearest.length,
      sampled:list.length>sample.length,
      medianM:median(nearest),
      minM:nearest[0]||0,maxM:nearest[nearest.length-1]||0,
      meanM:nearest.length?nearest.reduce((a,b)=>a+b,0)/nearest.length:0
    };
  }
'''
new='''  function spacingStats(swales){
    const list=(swales||[]).filter(s=>s&&s.pts&&s.pts.length>1);
    const sample=earthlineDeterministicSpacingSample15770(list,64);
    const regional=!!(M.loc&&(/Regional Opportunity Tile/i.test(String(M.loc.name||""))||(Array.isArray(M.loc.zones)&&M.loc.zones.includes("Regional Tile"))));
    let componentBySwale15770=null,componentCount15770=0;
    if(!regional&&typeof earthlineSafeCell==="function"&&Number.isFinite(Number(GW))&&Number.isFinite(Number(GH))&&Number.isFinite(Number(N))){
      const comp15770=new Int32Array(N);
      const dirs15770=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
      for(let y=1;y<GH-1;y++)for(let x=1;x<GW-1;x++){
        const i=idx(x,y);
        if(comp15770[i]||!M.inP[i]||!earthlineSafeCell(x,y,4))continue;
        componentCount15770++;
        const q=[i];comp15770[i]=componentCount15770;
        for(let qi=0;qi<q.length;qi++){
          const k=q[qi],cx=k%GW,cy=Math.floor(k/GW);
          for(const d of dirs15770){
            const nx=cx+d[0],ny=cy+d[1];
            if(nx<1||ny<1||nx>=GW-1||ny>=GH-1)continue;
            const ni=idx(nx,ny);
            if(comp15770[ni]||!M.inP[ni]||!earthlineSafeCell(nx,ny,4))continue;
            comp15770[ni]=componentCount15770;q.push(ni);
          }
        }
      }
      componentBySwale15770=new WeakMap();
      for(const sw of list){
        const counts15770=new Map();
        for(const p of sw.pts||[]){
          const x=clampN(Math.round(Number(p[0])),0,GW-1),y=clampN(Math.round(Number(p[1])),0,GH-1);
          const c=comp15770[idx(x,y)]||0;
          if(c>0)counts15770.set(c,(counts15770.get(c)||0)+1);
        }
        let bestC=0,bestN=0;
        for(const [c,n] of counts15770)if(n>bestN){bestC=c;bestN=n;}
        componentBySwale15770.set(sw,bestC);
      }
    }
    const nearest=[];
    for(const subject of sample){
      let best=Infinity;
      const subjectComponent15770=componentBySwale15770?Number(componentBySwale15770.get(subject)||0):0;
      for(const other of list){
        if(subject===other)continue;
        if(subject.bandKey!=null&&other.bandKey!=null&&subject.bandKey===other.bandKey)continue;
        if(componentBySwale15770&&subjectComponent15770>0&&Number(componentBySwale15770.get(other)||0)!==subjectComponent15770)continue;
        if(earthlineBBoxGapM15770(subject,other)>=best)continue;
        const d=earthlinePathDistanceFast15770(subject,other,best);
        if(d<best)best=d;
      }
      if(Number.isFinite(best))nearest.push(best);
    }
    nearest.sort((a,b)=>a-b);
    return {
      populationCount:list.length,
      sampleCount:nearest.length,
      sampled:list.length>sample.length,
      componentAware:!!componentBySwale15770,
      componentCount:componentCount15770,
      medianM:median(nearest),
      minM:nearest[0]||0,maxM:nearest[nearest.length-1]||0,
      meanM:nearest.length?nearest.reduce((a,b)=>a+b,0)/nearest.length:0
    };
  }
'''
if s.count(old)!=1:
    raise SystemExit(f"expected one spacingStats owner; found {s.count(old)}")
p.write_text(s.replace(old,new),encoding="utf-8")
