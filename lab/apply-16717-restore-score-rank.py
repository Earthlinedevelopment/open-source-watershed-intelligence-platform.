from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    // Fail visibly rather than silently: use the best remaining terrain-derived contour segments when strict thinning produced too few.
    if(chosen.length<14){for(const c of candidates){if(chosen.length>=24)break;if(chosen.includes(c))continue;if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<4))continue;chosen.push(c);}}
    const contourToleranceM16166=5.0;"""
new="""    // Fail visibly rather than silently: use the best remaining terrain-derived contour segments when strict thinning produced too few.
    if(chosen.length<14){for(const c of candidates){if(chosen.length>=24)break;if(chosen.includes(c))continue;if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<4))continue;chosen.push(c);}}
    /* EARTHLINE 16717 — coverage reservation decides inclusion only.
       Regional rank/grade remains owned by the existing terrain score. */
    chosen.sort((a16717,b16717)=>(Number(b16717&&b16717.score)||0)-(Number(a16717&&a16717.score)||0));
    window.EARTHLINE_REGIONAL_SCORE_ORDER_16717={
      chosen:chosen.length,
      refined:chosen.filter(c16717=>c16717&&(c16717.refined16710||c16717.refined16702)).length,
      monotonic:chosen.every((c16717,i16717)=>i16717===0||(Number(chosen[i16717-1]&&chosen[i16717-1].score)||0)>=(Number(c16717&&c16717.score)||0)),
      top20:chosen.slice(0,20).map(c16717=>({score:Number(c16717&&c16717.score)||0,refined:!!(c16717&&(c16717.refined16710||c16717.refined16702)),x:c16717&&c16717.x,y:c16717&&c16717.y})),
      rule:'coverage reservation controls inclusion; descending terrain score controls statewide rank and grade',
      at:new Date().toISOString()
    };
    const contourToleranceM16166=5.0;"""
n=s.count(old)
if n!=1:
    raise SystemExit(f"16717 rank anchor expected once, found {n}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("16717 applied: retained coverage, restored score-owned statewide ranking")
