from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")
repls=[
("""    const work15771=isRegionalTile15769
      ? {maxLevels:14,maxSeedsPerLevel:4,maxCandidates:10,maxFinal:6,perLevel:1,maxMs:2000}
      : {maxLevels:72,maxSeedsPerLevel:16,maxCandidates:256,maxFinal:200,perLevel:16,maxMs:120000};""",
"""    const work15771=isRegionalTile15769
      ? {maxLevels:18,maxSeedsPerLevel:6,maxCandidates:24,maxFinal:12,perLevel:2,maxMs:2000}
      : {maxLevels:72,maxSeedsPerLevel:16,maxCandidates:256,maxFinal:200,perLevel:16,maxMs:120000};"""),
("const effectiveSeedBudget15841=isRegionalTile15769?2:work15771.maxSeedsPerLevel;",
 "const effectiveSeedBudget15841=isRegionalTile15769?4:work15771.maxSeedsPerLevel;"),
("""    const kept=[],keptBBox16204=[];
    const spacingPadCells16204=Math.max(0,Number(minSpacingM15771||0)/Math.max(.05,Number(M.cellM||1)));""",
"""    const kept=[],keptBBox16204=[];
    const exactGeometryKeys17699=new Set();
    function exactSwaleKey17699(sw){
      const pts=Array.isArray(sw&&sw.pts)?sw.pts:[];
      if(!pts.length)return "";
      const norm=pts.map(p=>[Number(p[0]).toFixed(5),Number(p[1]).toFixed(5)]);
      const f=JSON.stringify(norm),r=JSON.stringify(norm.slice().reverse());
      return f<r?f:r;
    }
    const spacingPadCells16204=Math.max(0,Number(minSpacingM15771||0)/Math.max(.05,Number(M.cellM||1)));"""),
("""      let tooClose=false;const swBBox16204=earthlineSwaleGridBBox16204(sw);
      const spacingCandidates16456=spacingIndexCandidates16456(swBBox16204);""",
"""      let tooClose=false;const swBBox16204=earthlineSwaleGridBBox16204(sw);
      const exactKey17699=exactSwaleKey17699(sw);
      if(exactKey17699&&exactGeometryKeys17699.has(exactKey17699)){
        if(finalRec15803){
          finalRec15803.status="rejected-final-spacing";
          finalRec15803.reason="exact-duplicate-geometry";
          earthlineCoverageZone15803(coverageDiag15803,finalRec15803.x,finalRec15803.y).rejections.finalSpacing++;
        }
        M.swaleDiagnostics.stage.rejectFinalSpacing++;
        continue;
      }
      const spacingCandidates16456=spacingIndexCandidates16456(swBBox16204);"""),
("kept.push(sw);keptBBox16204.push(swBBox16204);spacingIndexAdd16456(kept.length-1,swBBox16204);",
 "kept.push(sw);if(exactKey17699)exactGeometryKeys17699.add(exactKey17699);keptBBox16204.push(swBBox16204);spacingIndexAdd16456(kept.length-1,swBBox16204);")
]
for i,(a,b) in enumerate(repls,1):
    n=s.count(a)
    if n!=1:
        raise SystemExit(f"repair target {i} count {n}, expected 1")
    s=s.replace(a,b,1)
p.write_text(s)
print("EARTHLINE_M75_ENGINE_CORE_REPAIR_OK")
