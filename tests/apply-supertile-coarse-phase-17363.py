from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="      const start16839=performance.now(),N16839=24,groupSize16839=6,channel16839=percentile(hy.acc,.972),rows16839=[];"
new="      const start16839=performance.now(),N16839=24,groupSize16839=6,channel16839=percentile(hy.acc,.972),rows16839=[],preScanStart17363=performance.now();"
if s.count(old)!=1: raise SystemExit(f"start anchor {s.count(old)}")
s=s.replace(old,new,1)
old="      for(const f16839 of swales.features||[]){const c16839=f16839?.geometry?.type==='LineString'?f16839.geometry.coordinates:null;"
new="      const preScanDone17363=performance.now();\n      for(const f16839 of swales.features||[]){const c16839=f16839?.geometry?.type==='LineString'?f16839.geometry.coordinates:null;"
if s.count(old)!=1: raise SystemExit(f"prescan end anchor {s.count(old)}")
s=s.replace(old,new,1)
old="      const added16839=[],groupRows16839=[],failed16839=[],occupied16839=new Set((supplementalCandidates16702||[]).map(c16839=>String(c16839.x)+','+String(c16839.y)));"
new="      const groupsStart17363=performance.now(),added16839=[],groupRows16839=[],failed16839=[],occupied16839=new Set((supplementalCandidates16702||[]).map(c16839=>String(c16839.x)+','+String(c16839.y)));"
if s.count(old)!=1: raise SystemExit(f"groups start anchor {s.count(old)}")
s=s.replace(old,new,1)
old="      if(added16839.length){supplementalCandidates16702.push(...added16839);swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);}"
new="      const groupsDone17363=performance.now();let finalRerunStart17363=groupsDone17363,finalRerunDone17363=groupsDone17363;\n      if(added16839.length){supplementalCandidates16702.push(...added16839);finalRerunStart17363=performance.now();swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);finalRerunDone17363=performance.now();}"
if s.count(old)!=1: raise SystemExit(f"rerun anchor {s.count(old)}")
s=s.replace(old,new,1)
old="window.EARTHLINE_STATEWIDE_SUPERTILE_16839={build:'EARTHLINE 16841',grid:'24x24 grouped 6x6; median-only cell phases',gaps:gaps16839.length,groups:groups16839.size,added:added16839.length,failed:failed16839.length,elapsedMs:Math.round(performance.now()-start16839),"
new="window.EARTHLINE_STATEWIDE_SUPERTILE_16839={build:'EARTHLINE 16841',grid:'24x24 grouped 6x6; median-only cell phases',gaps:gaps16839.length,groups:groups16839.size,added:added16839.length,failed:failed16839.length,elapsedMs:Math.round(performance.now()-start16839),phase17363:{preScanMs:Math.round(preScanDone17363-preScanStart17363),groupsMs:Math.round(groupsDone17363-groupsStart17363),finalRerunMs:Math.round(finalRerunDone17363-finalRerunStart17363)},"
if s.count(old)!=1: raise SystemExit(f"audit anchor {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_SUPERTILE_COARSE_PHASE_17363: diagnostic-only pre-scan/groups/final-rerun timing; no behavior change. -->\n"+s
p.write_text(s,encoding="utf-8")
print("instrumented supertile coarse phases 17363")
