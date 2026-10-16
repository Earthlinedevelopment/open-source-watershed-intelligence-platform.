from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""          const savedGen16839=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167,c16839=await makeContours(sub16839,true,levels16839),s16839=await makeSwales(sub16839,c16839,false,swaleJurisdictionGeometry16539,null);window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16839;"""
new="""          const savedGen16839=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167,groupContourStart17289=performance.now(),c16839=await makeContours(sub16839,true,levels16839),groupContourDone17289=performance.now(),s16839=await makeSwales(sub16839,c16839,false,swaleJurisdictionGeometry16539,null),groupSwaleDone17289=performance.now();window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16839;"""
if s.count(old)!=1: raise SystemExit(f"supertile make anchor count {s.count(old)}")
s=s.replace(old,new,1)
old2="""          groupRows16839.push({key:key16839,gaps:gapsGroup16839.length,levels:levels16839.length,added:groupAdded16839});"""
new2="""          groupRows16839.push({key:key16839,gaps:gapsGroup16839.length,levels:levels16839.length,added:groupAdded16839,contourMs:Math.round(groupContourDone17289-groupContourStart17289),swaleMs:Math.round(groupSwaleDone17289-groupContourDone17289)});"""
if s.count(old2)!=1: raise SystemExit(f"supertile row anchor count {s.count(old2)}")
s=s.replace(old2,new2,1)
s="<!-- EARTHLINE_SUPERTILE_PHASE_TIMING_17289: diagnostic contour-vs-swale timing per 16841 group; no behavior/science changes. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched supertile phase timings 17289")
