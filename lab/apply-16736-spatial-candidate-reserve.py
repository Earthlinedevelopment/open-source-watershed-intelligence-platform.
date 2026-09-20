from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""    const jurisdictionEligibleCandidates16539=candidates.length;
    candidates.sort((a,b)=>b.score-a.score);
    const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));
    const refinedPool16713=!focusMode?candidates.filter(c=>c&&(c.refined16710||c.refined16702)):[];
    const refinedReserved16713=[];"""

new="""    const jurisdictionEligibleCandidates16539=candidates.length;
    candidates.sort((a,b)=>b.score-a.score);
    const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));
    /* EARTHLINE 16736 — selection may not erase whole terrain sectors that have
       jurisdiction-screened valid candidates. Reserve the best candidate in each
       occupied 6x6 candidate bin, then let the existing score/spacing owner fill
       remaining capacity. Final A/B/C rank still sorts strictly by score. */
    const coverageGroups16736=new Map(),coverageReserved16736=[];
    if(!focusMode){
      for(const c16736 of candidates){
        if(!c16736||!Number.isFinite(Number(c16736.x))||!Number.isFinite(Number(c16736.y)))continue;
        const bx16736=Math.max(0,Math.min(5,Math.floor(Number(c16736.x)*6/Math.max(1,hy.w))));
        const by16736=Math.max(0,Math.min(5,Math.floor(Number(c16736.y)*6/Math.max(1,hy.h))));
        const key16736=bx16736+','+by16736;let list16736=coverageGroups16736.get(key16736);
        if(!list16736)coverageGroups16736.set(key16736,list16736=[]);
        list16736.push(c16736);
      }
      for(const [key16736,list16736] of coverageGroups16736){
        list16736.sort((a16736,b16736)=>(Number(b16736.score)||0)-(Number(a16736.score)||0));
        const c16736=list16736[0];if(c16736&&!chosen.includes(c16736)){chosen.push(c16736);coverageReserved16736.push({key:key16736,x:c16736.x,y:c16736.y,score:Number(c16736.score)||0,refined:!!(c16736.refined16710||c16736.refined16702),coverageGap:!!c16736.coverageGap16731});}
      }
    }
    window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16736',candidateBins:coverageGroups16736.size,reserved:coverageReserved16736.length,rows:coverageReserved16736,rule:'reserve one highest-scoring jurisdiction-screened candidate in every occupied 6x6 candidate bin before statewide score/spacing fill',at:new Date().toISOString()};
    const refinedPool16713=!focusMode?candidates.filter(c=>c&&(c.refined16710||c.refined16702)):[];
    const refinedReserved16713=[];"""

n=s.count(old)
if n!=1: raise SystemExit(f"16736 selection anchor expected once, found {n}")
s=s.replace(old,new,1)

# Existing refined guarantee must not push a candidate already reserved by its bin.
old2="""      for(const c16733 of list16733.slice(0,2)){if(!refinedReserved16713.includes(c16733)){refinedReserved16713.push(c16733);chosen.push(c16733);}}"""
new2="""      for(const c16733 of list16733.slice(0,2)){if(!refinedReserved16713.includes(c16733)){refinedReserved16713.push(c16733);if(!chosen.includes(c16733))chosen.push(c16733);}}"""
n=s.count(old2)
if n!=1: raise SystemExit(f"16736 refined anchor expected once, found {n}")
s=s.replace(old2,new2,1)

p.write_text(s,encoding="utf-8")
print("16736 applied")
