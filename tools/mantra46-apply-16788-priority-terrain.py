from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

marker="<!-- EARTHLINE 16784 — STANDARDIZED ROOT-CAUSE AUDIT."
comment="<!-- EARTHLINE 16788 — PRIORITIZED EFFICIENT TERRAIN-GAP RECOVERY. Regional only: preserve 16787's real 32x32 local terrain refinement, but restore a bounded 8–16 tile budget and prioritize opportunity-rich cells lacking coarse contour geometry before already-contoured gaps. This retains the shared slope/water/aquifer/exclusion science, jurisdiction containment, mapped-water safety, ranking and final capacity while recovering performance margin. Property unchanged. CANDIDATE / NOT ACCEPTED. -->\n"
if "EARTHLINE 16788 — PRIORITIZED EFFICIENT TERRAIN-GAP RECOVERY" not in s:
    n=s.count(marker)
    if n!=1: raise SystemExit(f"16784 marker expected once, found {n}")
    s=s.replace(marker,comment+marker,1)

repls=[
("const refinementTileBudget16782=Math.min(24,Math.max(12,Math.ceil(gapsBefore16780.length/2)));",
 "const refinementTileBudget16782=Math.min(16,Math.max(8,Math.ceil(gapsBefore16780.length/3)));"),
("""      const selected16780=[],parentUse16780=new Map();
      for(const row16780 of gapsBefore16780){
        row16780.cluster16781=gapsBefore16780.filter(o16781=>Math.hypot(o16781.bx-row16780.bx,o16781.by-row16780.by)<=1.5).length;
      }""",
"""      const selected16780=[],parentUse16780=new Map(),coarseContourCells16788=new Set();
      for(const f16788 of (swaleCandidateContours16609&&swaleCandidateContours16609.features||[])){
        const coords16788=f16788&&f16788.geometry&&f16788.geometry.type==='LineString'?f16788.geometry.coordinates:null;
        if(!Array.isArray(coords16788))continue;
        for(const p16788 of coords16788){
          const g16788=llGrid(hy,p16788);if(!g16788||!Number.isFinite(Number(g16788.x))||!Number.isFinite(Number(g16788.y)))continue;
          const bx16788=Math.max(0,Math.min(11,Math.floor(Number(g16788.x)*12/Math.max(1,hy.w))));
          const by16788=Math.max(0,Math.min(11,Math.floor(Number(g16788.y)*12/Math.max(1,hy.h))));
          coarseContourCells16788.add(bx16788+','+by16788);
        }
      }
      for(const row16780 of gapsBefore16780){
        row16780.cluster16781=gapsBefore16780.filter(o16781=>Math.hypot(o16781.bx-row16780.bx,o16781.by-row16780.by)<=1.5).length;
        row16780.coarseContourHit16788=coarseContourCells16788.has(row16780.bx+','+row16780.by)?1:0;
      }"""),
("const metric16781=(Number(row16780.cluster16781)||0)*100+spread16781*24+ratio16781*20+pref16781*5+row16780.opportunity/16;",
 "const metric16781=(row16780.coarseContourHit16788?0:10000)+pref16781*1200+ratio16781*180+row16780.preferred*6+spread16781*24+(Number(row16780.cluster16781)||0)*12+row16780.opportunity/16;"),
("selected:selected16780.map(r16780=>({bx:r16780.bx,by:r16780.by,valid:r16780.valid,opportunity:r16780.opportunity,preferred:r16780.preferred,cluster:Number(r16780.cluster16781||0)}))",
 "selected:selected16780.map(r16780=>({bx:r16780.bx,by:r16780.by,valid:r16780.valid,opportunity:r16780.opportunity,preferred:r16780.preferred,cluster:Number(r16780.cluster16781||0),coarseContourHit16788:Number(r16780.coarseContourHit16788||0)}))")
]

for old,new in repls:
    n=s.count(old)
    if n!=1: raise SystemExit(f"expected exactly one occurrence for {old[:90]!r}; found {n}")
    s=s.replace(old,new,1)

p.write_text(s,encoding="utf-8")
print("EARTHLINE 16788 installer applied")
