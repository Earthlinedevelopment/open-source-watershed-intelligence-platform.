from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="const reserveBudget16775=Math.min(regionalCapacity16755,totalSubs16775);"
new="const reserveBudget16775=Math.min(regionalCapacity16755,totalSubs16775,coverageGroups16736.size*3);"
if s.count(old)!=1:
    raise SystemExit(f"EARTHLINE 17703 anchor count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("EARTHLINE_17703_REGIONAL_BALANCE_APPLIED")
