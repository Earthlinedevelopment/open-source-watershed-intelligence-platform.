from pathlib import Path
import re

p=Path("index.html")
s=p.read_text(errors="strict")

start=s.rfind("async function prescribeSwales15778(")
end=s.find("\n  prescribeSwales=prescribeSwales15778;",start)
if start<0 or end<0:
    raise SystemExit(f"PRESCRIBER_BOUNDS={start},{end}")

seg=s[start:end]

budget_pat=re.compile(
    r"const work15771=isRegionalTile15769\s*\?\s*"
    r"\{maxLevels:\d+,maxSeedsPerLevel:\d+,maxCandidates:\d+,maxFinal:\d+,perLevel:\d+,maxMs:\d+\}\s*"
    r":\s*\{maxLevels:72,maxSeedsPerLevel:16,maxCandidates:256,maxFinal:200,perLevel:16,maxMs:120000\};"
)
budget_repl="""const work15771=isRegionalTile15769
      ? {maxLevels:24,maxSeedsPerLevel:6,maxCandidates:28,maxFinal:12,perLevel:3,maxMs:2500}
      : {maxLevels:72,maxSeedsPerLevel:16,maxCandidates:256,maxFinal:200,perLevel:16,maxMs:120000};"""
seg,n1=budget_pat.subn(budget_repl,seg,count=1)

seed_pat=re.compile(r"const effectiveSeedBudget15841=isRegionalTile15769\?\d+:work15771\.maxSeedsPerLevel;")
seg,n2=seed_pat.subn("const effectiveSeedBudget15841=isRegionalTile15769?4:work15771.maxSeedsPerLevel;",seg,count=1)

same_band="        if(sw.bandKey===ex.bandKey)continue;\n"
n3=seg.count(same_band)
if n3==1:
    seg=seg.replace(same_band,"",1)

if n1!=1 or n2!=1 or n3!=1:
    raise SystemExit(f"PATCH_COUNTS budget={n1} seed={n2} sameBand={n3}")

s=s[:start]+seg+s[end:]
p.write_text(s)
print("EARTHLINE_M75_ENGINE_PATCH_OK",n1,n2,n3)
