from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")

# 1) exact duplicate swales cannot survive final spacing merely because they share a contour band
old_kept="""    const kept=[],keptBBox16204=[];
    const spacingPadCells16204=Math.max(0,Number(minSpacingM15771||0)/Math.max(.05,Number(M.cellM||1)));"""
new_kept="""    const kept=[],keptBBox16204=[];
    const exactGeometryKeys17699=new Set();
    function exactSwaleKey17699(sw){
      const pts=Array.isArray(sw&&sw.pts)?sw.pts:[];
      if(!pts.length)return "";
      const norm=pts.map(p=>[Number(p[0]).toFixed(5),Number(p[1]).toFixed(5)]);
      const f=JSON.stringify(norm),r=JSON.stringify(norm.slice().reverse());
      return f<r?f:r;
    }
    const spacingPadCells16204=Math.max(0,Number(minSpacingM15771||0)/Math.max(.05,Number(M.cellM||1)));"""
old_loop="""      let tooClose=false;const swBBox16204=earthlineSwaleGridBBox16204(sw);
      const spacingCandidates16456=spacingIndexCandidates16456(swBBox16204);"""
new_loop="""      let tooClose=false;const swBBox16204=earthlineSwaleGridBBox16204(sw);
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
      const spacingCandidates16456=spacingIndexCandidates16456(swBBox16204);"""
old_push="kept.push(sw);keptBBox16204.push(swBBox16204);spacingIndexAdd16456(kept.length-1,swBBox16204);"
new_push="kept.push(sw);if(exactKey17699)exactGeometryKeys17699.add(exactKey17699);keptBBox16204.push(swBBox16204);spacingIndexAdd16456(kept.length-1,swBBox16204);"

# 2) Regional publication is atomic: do not repeatedly publish half-complete swale/tree surfaces after each tile
old_partial="""        state.tileStats[i]=result;if(result.status!=="complete")state.withheld++;
        rebuildRegionalGrades15772();
        if(!assertLocationIntegrity15801(parent,anchor,"regional","regional-tile-"+(i+1))){
          return false;
        }
        syncLayers15778("regional");updatePanels15778(true);await waitFrame();"""
new_partial="""        state.tileStats[i]=result;if(result.status!=="complete")state.withheld++;
        if(!assertLocationIntegrity15801(parent,anchor,"regional","regional-tile-"+(i+1))){
          return false;
        }
        /* EARTHLINE 17700 — atomic Regional publication.
           Keep progress in the governed busy control, but do not publish a half-built
           swale/tree aggregate after every serial DEM tile. The full aggregate is
           graded and rendered once below after all completed tiles are assembled. */
        await waitFrame();"""

for i,(a,b) in enumerate([(old_kept,new_kept),(old_loop,new_loop),(old_push,new_push),(old_partial,new_partial)],1):
    n=s.count(a)
    if n!=1: raise SystemExit(f"atomic engine target {i} count {n}, expected 1")
    s=s.replace(a,b,1)

p.write_text(s)
print("EARTHLINE_M75_ATOMIC_ENGINE_REPAIR_OK")
