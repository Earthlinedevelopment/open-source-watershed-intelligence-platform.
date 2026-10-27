from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
start=s.find("const savedGen16839=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167")
if start<0: raise SystemExit("supertile savedGen anchor missing")
end=s.find("window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16839;",start)
if end<0: raise SystemExit("supertile savedGen end missing")
end += len("window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16839;")
block=s[start:end]
contour="c16839=await makeContours(sub16839,true,levels16839),"
swale="s16839=await makeSwales(sub16839,c16839,false,null,null)"
if contour not in block: raise SystemExit("current contour anchor missing")
if swale not in block: raise SystemExit("current consolidated swale anchor missing")
block=block.replace(contour,"groupContourStart17354=performance.now(),"+contour,1)
block=block.replace(swale,"groupContourDone17354=performance.now(),"+swale+",groupSwaleDone17354=performance.now()",1)
s=s[:start]+block+s[end:]
old="groupRows16839.push({key:key16839,gaps:gapsGroup16839.length,levels:levels16839.length,added:groupAdded16839});"
new="groupRows16839.push({key:key16839,gaps:gapsGroup16839.length,levels:levels16839.length,added:groupAdded16839,contourMs:Math.round(groupContourDone17354-groupContourStart17354),swaleMs:Math.round(groupSwaleDone17354-groupContourDone17354)});"
if s.count(old)!=1: raise SystemExit(f"groupRows anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_SUPERTILE_PHASE_TIMING_17354: diagnostic-only timing for current consolidated 17325 supertile call; no behavior/science changes. -->\n"+s
p.write_text(s,encoding="utf-8")
print("instrumented current supertile phases 17354")
