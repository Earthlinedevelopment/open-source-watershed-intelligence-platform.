from pathlib import Path
import re

p=Path("index.html")
s=p.read_text(errors="strict")

budget_pat=re.compile(
    r"const work15771=isRegionalTile15769\s*\?\s*"
    r"\{maxLevels:\d+,maxSeedsPerLevel:\d+,maxCandidates:\d+,maxFinal:\d+,perLevel:\d+,maxMs:\d+\}\s*"
    r":\s*\{maxLevels:72,maxSeedsPerLevel:16,maxCandidates:256,maxFinal:200,perLevel:16,maxMs:120000\};"
)
budget_repl="""const work15771=isRegionalTile15769
      ? {maxLevels:36,maxSeedsPerLevel:8,maxCandidates:48,maxFinal:24,perLevel:4,maxMs:10000}
      : {maxLevels:72,maxSeedsPerLevel:16,maxCandidates:256,maxFinal:200,perLevel:16,maxMs:120000};"""
s,n1=budget_pat.subn(budget_repl,s,count=1)

seed_pat=re.compile(
    r"const effectiveSeedBudget15841=isRegionalTile15769\?\d+:work15771\.maxSeedsPerLevel;"
)
s,n2=seed_pat.subn(
    "const effectiveSeedBudget15841=isRegionalTile15769?6:work15771.maxSeedsPerLevel;",
    s,
    count=1
)

if n1!=1:
    raise SystemExit("budget structural target count="+str(n1))
if n2!=1:
    raise SystemExit("seed structural target count="+str(n2))
if "exactGeometrySeen17699" not in s:
    raise SystemExit("exact duplicate guard missing")

p.write_text(s)
print("EARTHLINE_M75_ENGINE_PATCH_OK")
