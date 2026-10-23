from pathlib import Path

p = Path("index.html")
s = p.read_text(errors="strict")

pairs = [
(
"""const work15771=isRegionalTile15769
      ? {maxLevels:14,maxSeedsPerLevel:4,maxCandidates:10,maxFinal:6,perLevel:1,maxMs:2000}
      : {maxLevels:72,maxSeedsPerLevel:16,maxCandidates:256,maxFinal:200,perLevel:16,maxMs:120000};""",
"""const work15771=isRegionalTile15769
      ? {maxLevels:24,maxSeedsPerLevel:6,maxCandidates:28,maxFinal:12,perLevel:3,maxMs:2500}
      : {maxLevels:72,maxSeedsPerLevel:16,maxCandidates:256,maxFinal:200,perLevel:16,maxMs:120000};"""
),
(
"const effectiveSeedBudget15841=isRegionalTile15769?2:work15771.maxSeedsPerLevel;",
"const effectiveSeedBudget15841=isRegionalTile15769?4:work15771.maxSeedsPerLevel;"
),
(
"    const kept=[],keptBBox16204=[];",
"""    const kept=[],keptBBox16204=[];
    const exactGeometrySeen17699=new Set();
    function earthlineExactGeometrySignature17699(sw){
      const pts=Array.isArray(sw&&sw.pts)?sw.pts:[];
      if(!pts.length)return '';
      const norm=pts.map(p=>[
        Math.round(Number(p[0]||0)*1000)/1000,
        Math.round(Number(p[1]||0)*1000)/1000
      ]);
      const f=JSON.stringify(norm),r=JSON.stringify(norm.slice().reverse());
      return f<r?f:r;
    }"""
),
(
"""      let tooClose=false;const swBBox16204=earthlineSwaleGridBBox16204(sw);
      const spacingCandidates16456=spacingIndexCandidates16456(swBBox16204);""",
"""      const exactSig17699=earthlineExactGeometrySignature17699(sw);
      if(exactSig17699&&exactGeometrySeen17699.has(exactSig17699)){
        if(finalRec15803){
          finalRec15803.status="rejected-final-spacing";
          finalRec15803.reason="exact-duplicate";
          earthlineCoverageZone15803(coverageDiag15803,finalRec15803.x,finalRec15803.y).rejections.finalSpacing++;
        }
        M.swaleDiagnostics.stage.rejectFinalSpacing++;
        continue;
      }
      let tooClose=false;const swBBox16204=earthlineSwaleGridBBox16204(sw);
      const spacingCandidates16456=spacingIndexCandidates16456(swBBox16204);"""
),
(
"      kept.push(sw);keptBBox16204.push(swBBox16204);spacingIndexAdd16456(kept.length-1,swBBox16204);",
"""      kept.push(sw);keptBBox16204.push(swBBox16204);
      if(exactSig17699)exactGeometrySeen17699.add(exactSig17699);
      spacingIndexAdd16456(kept.length-1,swBBox16204);"""
),
]

for i,(old,new) in enumerate(pairs,1):
    n=s.count(old)
    if n != 1:
        raise SystemExit(f"PATCH_{i}_COUNT={n}")
    s=s.replace(old,new,1)

p.write_text(s)
print("EARTHLINE_M75_ENGINE_PATCH_OK")
