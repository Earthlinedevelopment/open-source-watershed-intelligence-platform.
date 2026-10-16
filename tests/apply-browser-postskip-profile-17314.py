from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old1="    const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];"
new1="    const phase17314Start=performance.now();\n    const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];"
if s.count(old1)!=1: raise SystemExit("start anchor")
s=s.replace(old1,new1,1)

old2="""    const preferredEligibleCount16539=focusMode?await jurisdictionEligibleCount16539(candidates):null;
    if(!focusMode||preferredEligibleCount16539<36){"""
new2="""    const phase17314CandidateEnd=performance.now(),phase17314PreferredStart=performance.now();
    const preferredEligibleCount16539=focusMode?await jurisdictionEligibleCount16539(candidates):null;
    const phase17314PreferredEnd=performance.now();
    if(!focusMode||preferredEligibleCount16539<36){"""
if s.count(old2)!=1: raise SystemExit("postskip preferred anchor")
s=s.replace(old2,new2,1)

old3="""    const candidatesBeforeJurisdiction16539=candidates.length;
    let jurisdictionRejectedCandidates16539=0;
    if(!focusMode&&jurisdictionGeometry16539){"""
new3="""    const candidatesBeforeJurisdiction16539=candidates.length;
    let jurisdictionRejectedCandidates16539=0;
    const phase17314RelaxedEnd=performance.now(),phase17314FinalStart=performance.now();
    if(!focusMode&&jurisdictionGeometry16539){"""
if s.count(old3)!=1: raise SystemExit("final start anchor")
s=s.replace(old3,new3,1)

old4="""    const jurisdictionEligibleCandidates16539=candidates.length;
    candidates.sort((a,b)=>b.score-a.score);"""
new4="""    const phase17314FinalEnd=performance.now(),jurisdictionEligibleCandidates16539=candidates.length;
    const row17314={w:hy.w,h:hy.h,focusMode:!!focusMode,lines:lines.length,candidatesBeforeJurisdiction:candidatesBeforeJurisdiction16539,jurisdictionEligible:jurisdictionEligibleCandidates16539,
      candidateGenMs:Math.round(phase17314CandidateEnd-phase17314Start),preferredScreenMs:Math.round(phase17314PreferredEnd-phase17314PreferredStart),
      relaxedGenMs:Math.round(phase17314RelaxedEnd-phase17314PreferredEnd),finalScreenMs:Math.round(phase17314FinalEnd-phase17314FinalStart),
      preSelectionMs:Math.round(phase17314FinalEnd-phase17314Start)};
    (window.EARTHLINE_MAKESWALES_POSTSKIP_17314||(window.EARTHLINE_MAKESWALES_POSTSKIP_17314=[])).push(row17314);
    candidates.sort((a,b)=>b.score-a.score);"""
if s.count(old4)!=1: raise SystemExit("final end anchor")
s=s.replace(old4,new4,1)

old5="""    const contours=await earthlineClipFeatureCollection16539(payload.contours,g);
    const flows=await earthlineClipFeatureCollection16539(payload.flows,g);
    const swales=earthlineRerankRegionalSwales16539(await earthlineClipFeatureCollection16539(payload.swales,g));
    const after={contours:contours.features.length,flows:flows.features.length,swales:swales.features.length};
    const outsideAfterClip={contours:await earthlineOutsideCoordinateCount16539(contours,g),flows:await earthlineOutsideCoordinateCount16539(flows,g),swales:await earthlineOutsideCoordinateCount16539(swales,g)};"""
new5="""    const clipStart17314=performance.now();
    const contours=await earthlineClipFeatureCollection16539(payload.contours,g),clipContoursEnd17314=performance.now();
    const flows=await earthlineClipFeatureCollection16539(payload.flows,g),clipFlowsEnd17314=performance.now();
    const swales=earthlineRerankRegionalSwales16539(await earthlineClipFeatureCollection16539(payload.swales,g)),clipSwalesEnd17314=performance.now();
    const after={contours:contours.features.length,flows:flows.features.length,swales:swales.features.length};
    const outsideAfterClip={contours:await earthlineOutsideCoordinateCount16539(contours,g),flows:await earthlineOutsideCoordinateCount16539(flows,g),swales:await earthlineOutsideCoordinateCount16539(swales,g)},outsideEnd17314=performance.now();
    window.EARTHLINE_PUBLICATION_CLIP_PHASE_17314={
      contoursMs:Math.round(clipContoursEnd17314-clipStart17314),
      flowsMs:Math.round(clipFlowsEnd17314-clipContoursEnd17314),
      swalesMs:Math.round(clipSwalesEnd17314-clipFlowsEnd17314),
      outsideVerifyMs:Math.round(outsideEnd17314-clipSwalesEnd17314),
      totalMs:Math.round(outsideEnd17314-clipStart17314)
    };"""
if s.count(old5)!=1: raise SystemExit("publication clip anchor")
s=s.replace(old5,new5,1)

p.write_text(s,encoding="utf-8")
print("instrumented post-skip makeSwales + publication clip 17314")
