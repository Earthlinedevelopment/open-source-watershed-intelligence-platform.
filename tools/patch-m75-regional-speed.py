from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='strict')
old='? {maxLevels:36,maxSeedsPerLevel:8,maxCandidates:48,maxFinal:24,perLevel:4,maxMs:10000}'
new='? {maxLevels:36,maxSeedsPerLevel:8,maxCandidates:48,maxFinal:24,perLevel:4,maxMs:5000}'
n=s.count(old)
if n != 1: raise SystemExit('REGIONAL_MAXMS_COUNT='+str(n))
s=s.replace(old,new,1)
p.write_text(s)
print('EARTHLINE_M75_REGIONAL_SPEED_PATCH_OK')