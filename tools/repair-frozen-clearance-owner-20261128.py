#!/usr/bin/env python3
"""Use scientifically frozen Property evidence as the only portable clearance owner."""
from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf8')
# Only this function: all unrelated renderers, hydrology, UI and Vermont behavior stay unchanged.
a=s.index('  function earthlineLockPropertyResult15815(force=false){')
z=s.index('  window.earthlineLockPropertyResult15815=earthlineLockPropertyResult15815;',a)
fn=s[a:z]
old="""    const failures=[];

    try{
      if(typeof window.earthlineFilterCorridors15788!=="function"){
        failures.push("corridor-filter-unavailable");
      }else{
        filtered=window.earthlineFilterCorridors15788(raw,true);
      }"""
new="""    const failures=[];
    /* Portable (open-data) Property science has already frozen the actual source
       evidence, no-build mask and input hash for this run. Do not re-screen those
       candidates using whatever unrelated Mapbox tiles the camera currently has
       rendered. Each proposed line still MUST pass the full frozen-mask audit.
       Authoritative-local (Vermont) keeps the existing exact-geometry filter. */
    const portableEvidence16544=!!(M&&M.vectorNoBuildCoverage&&
      M.vectorNoBuildCoverage.publicationAllowed===true&&
      M.vectorNoBuildCoverage.sourceTier!=="authoritative-local");

    try{
      if(portableEvidence16544){
        filtered={collection:raw,stats:{build:"EARTHLINE 2026-11-28",indexAvailable:false,
          sourceOwner:"frozen-scientific-input",inputCandidates:raw.features.length,
          outputSegments:raw.features.length,noBuildRejected:0}};
      }else if(typeof window.earthlineFilterCorridors15788!=="function"){
        failures.push("corridor-filter-unavailable");
      }else{
        filtered=window.earthlineFilterCorridors15788(raw,true);
      }"""
assert fn.count(old)==1, 'expected one existing volatile filter owner'
fn=fn.replace(old,new,1)
old2="""      if(typeof window.earthlineAuditCorridorClearance15806!=="function"){
        failures.push("clearance-audit-unavailable");
      }else if(candidate){
        audit=window.earthlineAuditCorridorClearance15806(candidate,false);
      }"""
new2="""      if(!portableEvidence16544){
        if(typeof window.earthlineAuditCorridorClearance15806!=="function"){
          failures.push("clearance-audit-unavailable");
        }else if(candidate){
          audit=window.earthlineAuditCorridorClearance15806(candidate,false);
        }
      }"""
assert fn.count(old2)==1, 'expected one map-style clearance audit'
fn=fn.replace(old2,new2,1)
old3="""      const portableEvidence16544=!!(M&&M.vectorNoBuildCoverage&&
        M.vectorNoBuildCoverage.publicationAllowed===true&&
        M.vectorNoBuildCoverage.sourceTier!=="authoritative-local");
"""
assert fn.count(old3)==1, 'expected one old portable owner declaration'
fn=fn.replace(old3,'',1)
assert fn.count('const portableEvidence16544=')==1
assert fn.count('earthlineFrozenPropertyClearanceAudit16255(candidate)')==1
assert fn.count('earthlineFilterRoadOverlaps16397(collection)')==1
newtext=s[:a]+fn+s[z:]
assert len(newtext)-len(s)<2000
p.write_text(newtext,encoding='utf8')
print(f"Changed only Property final clearance source-owner selection ({len(s)} -> {len(newtext)} chars).")
