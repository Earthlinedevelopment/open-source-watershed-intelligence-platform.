from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_screen="    const jurisdictionScreenCache16592=new WeakMap();"
new_screen="""    const jurisdictionScreenCache16592=(!focusMode&&hy&&typeof hy==='object')
      ?(hy.__earthlineJurisdictionScreenCache17279||(hy.__earthlineJurisdictionScreenCache17279=new WeakMap()))
      :new WeakMap();"""
if s.count(old_screen)!=1: raise SystemExit(f"screen cache anchor count {s.count(old_screen)}")
s=s.replace(old_screen,new_screen,1)

start="    const regionalAnchorAttempts16786=new Map();"
end="    if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);"
i=s.find(start); j=s.find(end,i)
if i<0 or j<0: raise SystemExit("base candidate anchors missing")
base=s[i:j]
wrapped="""    const regionalBaseCandidateCache17279=(!focusMode&&hy&&typeof hy==='object')?hy.__earthlineRegionalBaseCandidates17279:null;
    if(regionalBaseCandidateCache17279&&regionalBaseCandidateCache17279.contours===contours&&regionalBaseCandidateCache17279.jurisdiction===jurisdictionGeometry16539){
      candidates.push(...regionalBaseCandidateCache17279.primary);
      if(regionalBaseCandidateCache17279.spatialAudit)window.EARTHLINE_SPATIAL_ANCHOR_AUDIT_16786=regionalBaseCandidateCache17279.spatialAudit;
    }else{
"""+base+"""      if(!focusMode&&hy&&typeof hy==='object'){
        hy.__earthlineRegionalBaseCandidates17279={
          contours:contours,
          jurisdiction:jurisdictionGeometry16539,
          primary:candidates.slice(),
          relaxed:null,
          spatialAudit:window.EARTHLINE_SPATIAL_ANCHOR_AUDIT_16786||null
        };
      }
    }
"""
s=s[:i]+wrapped+s[j:]

old_relaxed="""    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);
    if(!focusMode||preferredEligibleCount16539<36){
      for(const f of lines){const coords=f.geometry.coordinates;if(coords.length<12)continue;for(const frac of [.28,.56,.82]){const c=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac))),true);if(c)candidates.push(c);}}
    }"""
new_relaxed="""    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);
    if(!focusMode){
      const cache17279=hy&&hy.__earthlineRegionalBaseCandidates17279;
      if(cache17279&&cache17279.contours===contours&&cache17279.jurisdiction===jurisdictionGeometry16539&&Array.isArray(cache17279.relaxed)){
        candidates.push(...cache17279.relaxed);
      }else{
        const relaxedStart17279=candidates.length;
        for(const f of lines){const coords=f.geometry.coordinates;if(coords.length<12)continue;for(const frac of [.28,.56,.82]){const c=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac))),true);if(c)candidates.push(c);}}
        if(cache17279&&cache17279.contours===contours&&cache17279.jurisdiction===jurisdictionGeometry16539)cache17279.relaxed=candidates.slice(relaxedStart17279);
      }
    }else if(preferredEligibleCount16539<36){
      for(const f of lines){const coords=f.geometry.coordinates;if(coords.length<12)continue;for(const frac of [.28,.56,.82]){const c=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac))),true);if(c)candidates.push(c);}}
    }"""
if s.count(old_relaxed)!=1: raise SystemExit(f"relaxed anchor count {s.count(old_relaxed)}")
s=s.replace(old_relaxed,new_relaxed,1)

s="<!-- EARTHLINE_RUN_SCOPED_SWALE_BASE_CACHE_17279: reuse immutable base Regional candidates and exact jurisdiction screening verdicts only within the same hydrology run; supplemental candidates, science, ranking, spacing and capacity unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched run-scoped Regional base candidate/screen cache 17279")
