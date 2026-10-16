from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old1="""    const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];"""
new1="""    const phase17302Start=performance.now();
    const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];"""
if s.count(old1)!=1: raise SystemExit("start anchor")
s=s.replace(old1,new1,1)

old2="""    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);
    if(!focusMode||preferredEligibleCount16539<36){"""
new2="""    const phase17302CandidateEnd=performance.now(),phase17302PreferredStart=performance.now();
    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);
    const phase17302PreferredEnd=performance.now();
    if(!focusMode||preferredEligibleCount16539<36){"""
if s.count(old2)!=1: raise SystemExit("preferred anchor")
s=s.replace(old2,new2,1)

old3="""    const candidatesBeforeJurisdiction16539=candidates.length;
    let jurisdictionRejectedCandidates16539=0;
    if(!focusMode&&jurisdictionGeometry16539){"""
new3="""    const candidatesBeforeJurisdiction16539=candidates.length;
    let jurisdictionRejectedCandidates16539=0;
    const phase17302RelaxedEnd=performance.now(),phase17302FinalStart=performance.now();
    if(!focusMode&&jurisdictionGeometry16539){"""
if s.count(old3)!=1: raise SystemExit("final start anchor")
s=s.replace(old3,new3,1)

old4="""    const jurisdictionEligibleCandidates16539=candidates.length;
    candidates.sort((a,b)=>b.score-a.score);"""
new4="""    const phase17302FinalEnd=performance.now(),jurisdictionEligibleCandidates16539=candidates.length;
    const row17302={w:hy.w,h:hy.h,focusMode:!!focusMode,lines:lines.length,candidatesBeforeJurisdiction:candidatesBeforeJurisdiction16539,jurisdictionEligible:jurisdictionEligibleCandidates16539,
      candidateGenMs:Math.round(phase17302CandidateEnd-phase17302Start),preferredScreenMs:Math.round(phase17302PreferredEnd-phase17302PreferredStart),
      relaxedGenMs:Math.round(phase17302RelaxedEnd-phase17302PreferredEnd),finalScreenMs:Math.round(phase17302FinalEnd-phase17302FinalStart),
      preSelectionMs:Math.round(phase17302FinalEnd-phase17302Start)};
    (window.EARTHLINE_MAKESWALES_PHASE_17302||(window.EARTHLINE_MAKESWALES_PHASE_17302=[])).push(row17302);
    console.log('EARTHLINE_MAKESWALES_PHASE_17302 '+JSON.stringify(row17302));
    candidates.sort((a,b)=>b.score-a.score);"""
if s.count(old4)!=1: raise SystemExit("final end anchor")
s=s.replace(old4,new4,1)

p.write_text(s,encoding="utf-8")
print("instrumented makeSwales phases 17302")
