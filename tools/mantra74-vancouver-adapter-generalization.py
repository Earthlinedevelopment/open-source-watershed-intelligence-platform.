from pathlib import Path
import re
p=Path("index.html")
s=p.read_text(encoding="utf-8")
before=s

def one(old,new,label):
    global s
    n=s.count(old)
    if n!=1:
        raise RuntimeError(f"{label}: expected 1 match, found {n}")
    s=s.replace(old,new,1)

one(
"""  function earthlineAdministrativeCapability16539(loc){
    const pt=String(loc&&loc.placeType||'').toLowerCase(),cc=String(loc&&loc.countryCode||'').toLowerCase();
    const nk=String(loc&&loc.name||loc&&loc.fullName||'').trim().toLowerCase();
    if(pt==='region'&&cc==='ca'&&nk.includes('vancouver island'))return earthlineBoundaryCapabilities16539.vancouverIsland;
    if(pt==='region'&&cc==='us')return earthlineBoundaryCapabilities16539.usState;
    if(pt==='country')return earthlineGlobalCountryCapability16845;
    return null;
  }""",
"""  function earthlineAdministrativeCapability16539(loc){
    const pt=String(loc&&loc.placeType||'').toLowerCase(),cc=String(loc&&loc.countryCode||'').toLowerCase();
    const center=[Number(loc&&loc.lng),Number(loc&&loc.lat)];
    const canadianIslandCoverage=pt==='region'&&cc==='ca'&&earthlineFinitePoint16539(center)&&earthlinePointInJurisdiction16539(center,EARTHLINE_VANCOUVER_ISLAND_GEOMETRY_16920);
    if(canadianIslandCoverage)return earthlineBoundaryCapabilities16539.vancouverIsland;
    if(pt==='region'&&cc==='us')return earthlineBoundaryCapabilities16539.usState;
    if(pt==='country')return earthlineGlobalCountryCapability16845;
    return null;
  }""",
"replace Vancouver place-name boundary selection with geometry coverage"
)

one(
"""    if(!focusMode&&/vancouver\s+island/i.test(String(q||""))){
      try{
        const boundary16912=selectionBoundary16539||await jurisdictionBoundaryPromise16539;""",
"""    const boundary16912=selectionBoundary16539||await jurisdictionBoundaryPromise16539;
    if(!focusMode&&String(boundary16912&&boundary16912.capability||'')==='ca-cgndb-vancouver-island'){
      try{""",
"trigger BC aquifer adapter from resolved capability"
)

# Remove Vancouver-only presentation hierarchy; shared renderer owns styling/stacking.
start=s.find("        try{\n          /* EARTHLINE 16915 — Vancouver Island display hierarchy.")
if start<0:
    raise RuntimeError("Vancouver display hierarchy start not found")
end=s.find("        }catch(_){}",start)
if end<0:
    raise RuntimeError("Vancouver display hierarchy end not found")
end+=len("        }catch(_){}")
s=s[:start]+s[end:]

# No query/name-gated Vancouver runtime behavior should remain.
for bad in [
    "nk.includes('vancouver island')",
    "/vancouver\\s+island/i.test(String(q||""))",
    "EARTHLINE 16915 — Vancouver Island display hierarchy"
]:
    if bad in s:
        raise RuntimeError("Vancouver runtime special case remains: "+bad)

p.write_text(s,encoding="utf-8")
print("EARTHLINE_VANCOUVER_ADAPTER_GENERALIZED",len(before)-len(s))

# trigger

# retry trigger

# validator retry
