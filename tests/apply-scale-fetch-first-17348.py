from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old_start="""        const tileResults16702=await Promise.all(tiles16702.map(async tile16702=>{
          const d16702=await loadDEM(tile16702.b,112,112,6000,'scale refinement '+tile16702.id),g16702=earthlineLandValidityMask16584(d16702,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16702;
"""
new_start="""        const loadedTiles17348=await Promise.all(tiles16702.map(async tile16702=>({tile16702,d16702:await loadDEM(tile16702.b,112,112,6000,'scale refinement '+tile16702.id)})));
        const tileResults16702=await Promise.all(loadedTiles17348.map(async ({tile16702,d16702})=>{
          const g16702=earthlineLandValidityMask16584(d16702,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16702;
"""
if s.count(old_start)!=1: raise SystemExit(f"scale refinement fetch/compute anchor count={s.count(old_start)}")
s=s.replace(old_start,new_start,1)
s="<!-- EARTHLINE_SCALE_FETCH_FIRST_17348: acquire all coastal DEMs before CPU-heavy refinement processing; identical inputs/science, avoids fetch/compute contention. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed coastal fetch-first refinement 17348")
