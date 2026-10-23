from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")
old="""const work15771=isRegionalTile15769
      ? {maxLevels:32,maxSeedsPerLevel:6,maxCandidates:40,maxFinal:10,perLevel:3,maxMs:9000}
      : {maxLevels:72,maxSeedsPerLevel:16,maxCandidates:256,maxFinal:200,perLevel:16,maxMs:120000};"""
new="""const work15771=isRegionalTile15769
      ? {maxLevels:36,maxSeedsPerLevel:8,maxCandidates:48,maxFinal:24,perLevel:4,maxMs:10000}
      : {maxLevels:72,maxSeedsPerLevel:16,maxCandidates:256,maxFinal:200,perLevel:16,maxMs:120000};"""
if s.count(old)!=1: raise SystemExit("BUDGET_COUNT="+str(s.count(old)))
s=s.replace(old,new,1)
old2="const effectiveSeedBudget15841=isRegionalTile15769?4:work15771.maxSeedsPerLevel;"
new2="const effectiveSeedBudget15841=isRegionalTile15769?6:work15771.maxSeedsPerLevel;"
if s.count(old2)!=1: raise SystemExit("SEED_COUNT="+str(s.count(old2)))
s=s.replace(old2,new2,1)
p.write_text(s)
print("EARTHLINE_REGIONAL_BUDGET_PATCH_OK")
