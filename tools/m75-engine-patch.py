from pathlib import Path

p=Path("index.html")
s=p.read_text(errors="strict")

old_budget="""const work15771=isRegionalTile15769
      ? {maxLevels:24,maxSeedsPerLevel:6,maxCandidates:28,maxFinal:12,perLevel:3,maxMs:2500}
      : {maxLevels:72,maxSeedsPerLevel:16,maxCandidates:256,maxFinal:200,perLevel:16,maxMs:120000};"""
new_budget="""const work15771=isRegionalTile15769
      ? {maxLevels:36,maxSeedsPerLevel:8,maxCandidates:48,maxFinal:24,perLevel:4,maxMs:10000}
      : {maxLevels:72,maxSeedsPerLevel:16,maxCandidates:256,maxFinal:200,perLevel:16,maxMs:120000};"""
old_seed="const effectiveSeedBudget15841=isRegionalTile15769?4:work15771.maxSeedsPerLevel;"
new_seed="const effectiveSeedBudget15841=isRegionalTile15769?6:work15771.maxSeedsPerLevel;"

if s.count(old_budget)!=1:
    raise SystemExit("budget target count="+str(s.count(old_budget)))
if s.count(old_seed)!=1:
    raise SystemExit("seed target count="+str(s.count(old_seed)))
if "exactGeometrySeen17699" not in s:
    raise SystemExit("exact duplicate guard missing")

s=s.replace(old_budget,new_budget,1)
s=s.replace(old_seed,new_seed,1)
p.write_text(s)
print("EARTHLINE_M75_ENGINE_PATCH_OK")
