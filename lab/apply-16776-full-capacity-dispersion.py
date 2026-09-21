from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_head="<!-- EARTHLINE 16775 — GLOBAL PROPORTIONAL DISPERSION + 48x48 LOCAL GAP REFINEMENT."
new_head="<!-- EARTHLINE 16776 — FULL-CAPACITY GLOBAL PROPORTIONAL DISPERSION. Existing Regional capacity, candidate pool, science gates, water sidecar, jurisdiction containment, ranking semantics and 48x48 local gap refinement are unchanged. The existing proportional 3x3-within-6x6 reserve now uses the full already-authoritative Regional capacity instead of stopping at an average three reserved subcells per occupied parent sector. Real screened candidates only; no jurisdiction names, synthetic corridors, relaxed science or extra capacity. CANDIDATE / NOT ACCEPTED. -->\n"+old_head
if old_head not in s: raise SystemExit("16775 header anchor missing")
s=s.replace(old_head,new_head,1)

old="const reserveBudget16775=Math.min(regionalCapacity16755,totalSubs16775,coverageGroups16736.size*3);"
new="const reserveBudget16775=Math.min(regionalCapacity16755,totalSubs16775);"
if s.count(old)!=1: raise SystemExit(f"reserve anchor count {s.count(old)}")
s=s.replace(old,new,1)

old2="window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16775'"
new2="window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16776'"
if s.count(old2)!=1: raise SystemExit(f"build marker count {s.count(old2)}")
s=s.replace(old2,new2,1)

old3="reservePerBin:'shared budget equivalent to 3 per occupied bin'"
new3="reservePerBin:'full existing Regional capacity distributed proportionally across occupied fine subcells'"
if s.count(old3)!=1: raise SystemExit(f"reserve label count {s.count(old3)}")
s=s.replace(old3,new3,1)

old4="rule:'distribute the unchanged global terrain reserve budget proportionally across occupied 3x3 subregions inside each 6x6 terrain sector; select real screened candidates only; science gates, water safety, final score ordering and capacity remain unchanged'"
new4="rule:'use the full unchanged Regional capacity as the proportional reserve budget across occupied 3x3 subregions inside each 6x6 terrain sector; select real screened candidates only; science gates, water safety, final score ordering and capacity remain unchanged'"
if s.count(old4)!=1: raise SystemExit(f"rule anchor count {s.count(old4)}")
s=s.replace(old4,new4,1)

p.write_text(s,encoding="utf-8")
print("16776 applied")
