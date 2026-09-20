from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""    candidates.sort((a,b)=>b.score-a.score);
    const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));
    for(const c of candidates){
      if(chosen.length>=80)break;
      const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));
      if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<spacing))continue;
      chosen.push(c);
    }"""
new="""    candidates.sort((a,b)=>b.score-a.score);
    const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));
    const refinedPool16713=!focusMode?candidates.filter(c=>c&&(c.refined16710||c.refined16702)):[];
    const refinedReserved16713=[];
    if(refinedPool16713.length){
      const remaining16713=refinedPool16713.slice();
      const target16713=Math.min(18,refinedPool16713.length);
      while(remaining16713.length&&refinedReserved16713.length<target16713){
        let bestI16713=0,bestMetric16713=-Infinity;
        for(let i16713=0;i16713<remaining16713.length;i16713++){
          const c16713=remaining16713[i16713];
          const d16713=refinedReserved16713.length?Math.min(...refinedReserved16713.map(p16713=>Math.hypot(p16713.x-c16713.x,p16713.y-c16713.y))):999;
          const metric16713=d16713*100+(Number(c16713.score)||0);
          if(metric16713>bestMetric16713){bestMetric16713=metric16713;bestI16713=i16713;}
        }
        const c16713=remaining16713.splice(bestI16713,1)[0];
        if(refinedReserved16713.some(p16713=>Math.hypot(p16713.x-c16713.x,p16713.y-c16713.y)<1.5))continue;
        refinedReserved16713.push(c16713);chosen.push(c16713);
      }
    }
    for(const c of candidates){
      if(chosen.length>=80)break;
      if(chosen.includes(c))continue;
      const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));
      if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<spacing))continue;
      chosen.push(c);
    }
    const range16713=(list16713,key16713)=>{const a16713=list16713.map(c16713=>Number(c16713[key16713])).filter(Number.isFinite);return a16713.length?Math.max(...a16713)-Math.min(...a16713):0;};
    window.EARTHLINE_REFINED_COVERAGE_SELECTION_16713={
      input:refinedPool16713.length,reserved:refinedReserved16713.length,
      inputXSpan:range16713(refinedPool16713,'x'),inputYSpan:range16713(refinedPool16713,'y'),
      reservedXSpan:range16713(refinedReserved16713,'x'),reservedYSpan:range16713(refinedReserved16713,'y'),
      rows:refinedReserved16713.map(c16713=>({x:c16713.x,y:c16713.y,score:c16713.score,slope:c16713.slope,coastKm:c16713.coastKm16710??c16713.coastKm16702??null,tile:c16713.tile16710??c16713.tile16702??null})),
      rule:'when high-resolution coastal candidates exist, reserve geographically distributed valid candidates before statewide ranking fills remaining capacity',
      at:new Date().toISOString()
    };"""
n=s.count(old)
if n!=1:
    raise SystemExit(f"selection anchor expected once, found {n}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("16713 applied")
