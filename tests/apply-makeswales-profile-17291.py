from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

a="async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16702=null){\n    const lines="
b="async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16702=null){\n    const profileStart17291=performance.now(),profileId17291=(window.EARTHLINE_MAKESWALES_PROFILE_SEQ_17291=(window.EARTHLINE_MAKESWALES_PROFILE_SEQ_17291||0)+1);\n    const lines="
if s.count(a)!=1: raise SystemExit("makeSwales anchor "+str(s.count(a)))
s=s.replace(a,b,1)

a="    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);"
b="""    const candidateBuiltAt17291=performance.now();
    const preferredScreenStart17291=performance.now();
    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);
    const preferredScreenEnd17291=performance.now();"""
if s.count(a)!=1: raise SystemExit("preferred anchor "+str(s.count(a)))
s=s.replace(a,b,1)

a="    const candidatesBeforeJurisdiction16539=candidates.length;\n    let jurisdictionRejectedCandidates16539=0;"
b="""    const candidatesBeforeJurisdiction16539=candidates.length;
    const relaxedBuiltAt17291=performance.now();
    let jurisdictionRejectedCandidates16539=0;
    const finalScreenStart17291=performance.now();"""
if s.count(a)!=1: raise SystemExit("final start anchor "+str(s.count(a)))
s=s.replace(a,b,1)

a="    const jurisdictionEligibleCandidates16539=candidates.length;\n    candidates.sort((a,b)=>b.score-a.score);"
b="""    const jurisdictionEligibleCandidates16539=candidates.length;
    const finalScreenEnd17291=performance.now();
    try{console.log("EARTHLINE_MAKESWALES_PROFILE_17291 "+JSON.stringify({
      id:profileId17291,w:Number(hy&&hy.w||0),h:Number(hy&&hy.h||0),focus:!!focusMode,
      contourLines:lines.length,candidatesBefore:candidatesBeforeJurisdiction16539,
      candidatesEligible:jurisdictionEligibleCandidates16539,
      candidateBuildMs:Number((candidateBuiltAt17291-profileStart17291).toFixed(2)),
      preferredScreenMs:Number((preferredScreenEnd17291-preferredScreenStart17291).toFixed(2)),
      relaxedBuildMs:Number((relaxedBuiltAt17291-preferredScreenEnd17291).toFixed(2)),
      finalScreenMs:Number((finalScreenEnd17291-finalScreenStart17291).toFixed(2)),
      elapsedToFinalScreenMs:Number((finalScreenEnd17291-profileStart17291).toFixed(2))
    }))}catch(_){}
    candidates.sort((a,b)=>b.score-a.score);"""
if s.count(a)!=1: raise SystemExit("final end anchor "+str(s.count(a)))
s=s.replace(a,b,1)

p.write_text(s,encoding="utf-8")
print("17291 makeSwales profiler applied")
