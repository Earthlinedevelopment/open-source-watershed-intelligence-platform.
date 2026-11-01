from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

marker="<!-- EARTHLINE 16787 — EFFICIENT TERRAIN-GAP RECOVERY. Remaining broad Regional voids were traced to opportunity-rich 12x12 cells whose coarse contour field did not produce enough local geometry. Preserve all existing science/safety/capacity owners; expand the bounded local terrain refinement only where measured gaps exist, using a lighter 32x32 local DEM so more real failed cells can be resolved inside the 15 s ceiling. No jurisdiction names, synthetic corridors, relaxed mapped-water safety, slope-rule change, selection-capacity change, or Property change. CANDIDATE / NOT ACCEPTED. -->\n"
if marker.strip() not in s:
    s=marker+s

repls=[
("const refinementTileBudget16782=Math.min(16,Math.max(8,Math.ceil(gapsBefore16780.length/4)));",
 "const refinementTileBudget16782=Math.min(24,Math.max(12,Math.ceil(gapsBefore16780.length/2)));"),
("const d16780=await loadDEM(tile16780.b,48,48,5500,'fine opportunity refinement '+tile16780.id);",
 "const d16780=await loadDEM(tile16780.b,32,32,5500,'fine opportunity refinement '+tile16780.id);")
]
for old,new in repls:
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"expected exactly one occurrence for {old[:90]!r}; found {n}")
    s=s.replace(old,new,1)

p.write_text(s,encoding="utf-8")
print("Applied EARTHLINE 16787 efficient terrain-gap recovery")
