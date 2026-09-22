from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

marker="<!-- EARTHLINE 16791 — CORRECTED REGIONAL AUDIT SEMANTICS."
comment="<!-- EARTHLINE 16792 — ATOMIC STATE DISPLAY OWNERSHIP. Registered U.S. state resolution now commits loc + centerLng + centerLat + viewZoom as one state package, and the existing Regional context-completion path reasserts the governed state bounds if any later presentation owner moved the map. No hydrology, slope, aquifer, exclusion, ranking, capacity, boundary, or Property science changes. CANDIDATE / NOT ACCEPTED. -->\n"
if "EARTHLINE 16792 — ATOMIC STATE DISPLAY OWNERSHIP" not in s:
    n=s.count(marker)
    if n!=1: raise SystemExit(f"16791 marker count {n}")
    s=s.replace(marker,comment+marker,1)

old="""      if(s){
        s.loc=loc16556;
        s.appliedSearchText=profile16549.query;
        s.jurisdictionPackage16556=package16556;
      }"""
new="""      if(s){
        s.loc=loc16556;
        s.centerLng=Number(loc16556.lng);
        s.centerLat=Number(loc16556.lat);
        s.viewZoom=Number(loc16556.zoomHint||s.viewZoom||5.7);
        s.appliedSearchText=profile16549.query;
        s.jurisdictionPackage16556=package16556;
      }"""
n=s.count(old)
if n!=1: raise SystemExit(f"atomic state commit count {n}")
s=s.replace(old,new,1)

anchor="        if(!propertyOwnsDisplay16726)setRunStatus((focusMode?'Focus screening published. ':(isVermont?'Vermont screening published. ':'Regional screening published. '))+(failures16198.length?'Unavailable context: '+failures16198.join(', ')+'. ':'Watershed and groundwater context updated. ')+swaleNote+(!focusMode?earthlineLandValidityStatus16584():''),'published');"
insert="        if(!propertyOwnsDisplay16726&&!focusMode){const cov16792=cameraCoverage(m,b);if(!Number.isFinite(cov16792)||cov16792<.98){const ok16792=await settleRegionalCamera(m,b,runToken);if(ok16792!==true)throw new Error('regional final display camera reconciliation failed');}}\n"+anchor
n=s.count(anchor)
if n!=1: raise SystemExit(f"context camera anchor count {n}")
s=s.replace(anchor,insert,1)

p.write_text(s,encoding="utf-8")
print("EARTHLINE 16792 location ownership applied")
