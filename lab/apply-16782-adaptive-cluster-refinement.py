from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name,old,new):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

patch("header",
"<!-- EARTHLINE 16781 — CLUSTER-AWARE FINE-CELL REFINEMENT.",
"<!-- EARTHLINE 16782 — ADAPTIVE CLUSTER-AWARE FINE-CELL REFINEMENT. The existing 16781 cluster-aware local-terrain pass keeps the same science, 48x48 local DEM resolution, jurisdiction containment, water sidecar, ranking and final Regional corridor capacity. Only its bounded refinement tile budget scales with the measured number of unresolved opportunity-rich 12x12 cells: 8 minimum, up to 16 maximum. Real terrain-derived corridors only; no jurisdiction names, synthetic corridors, relaxed science or added publication capacity. CANDIDATE / NOT ACCEPTED. -->\n<!-- EARTHLINE 16781 — CLUSTER-AWARE FINE-CELL REFINEMENT.")

patch("spatial-build",
"window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16781'",
"window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16782'")

patch("adaptive-budget",
"      while(selected16780.length<8){",
"      const refinementTileBudget16782=Math.min(16,Math.max(8,Math.ceil(gapsBefore16780.length/4)));\n      while(selected16780.length<refinementTileBudget16782){")

patch("fine-success",
"window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781={build:'EARTHLINE 16781',grid:'12x12',selected:selected16780.map",
"window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781={build:'EARTHLINE 16782',grid:'12x12',tileBudget:refinementTileBudget16782,selected:selected16780.map")

patch("fine-empty",
"window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781={build:'EARTHLINE 16781',grid:'12x12',selected:[]",
"window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781={build:'EARTHLINE 16782',grid:'12x12',tileBudget:refinementTileBudget16782,selected:[]")

p.write_text(s,encoding="utf-8")
print("16782 applied")
