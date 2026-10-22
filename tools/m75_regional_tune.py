from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text(errors='strict')
pairs=[
("{maxLevels:36,maxSeedsPerLevel:8,maxCandidates:48,maxFinal:24,perLevel:4,maxMs:10000}",
 "{maxLevels:32,maxSeedsPerLevel:6,maxCandidates:40,maxFinal:10,perLevel:3,maxMs:9000}"),
("const effectiveSeedBudget15841=isRegionalTile15769?6:work15771.maxSeedsPerLevel;",
 "const effectiveSeedBudget15841=isRegionalTile15769?4:work15771.maxSeedsPerLevel;")
]
for i,(old,new) in enumerate(pairs,1):
    n=s.count(old)
    if n!=1: raise SystemExit(f'TUNE_{i}_COUNT={n}')
    s=s.replace(old,new,1)
p.write_text(s)
print('EARTHLINE_M75_REGIONAL_TUNE_OK')
