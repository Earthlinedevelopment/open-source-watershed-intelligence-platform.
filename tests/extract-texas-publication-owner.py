from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
patterns=['async function loadDEM','function loadDEM','loadDEM=','async function loadDEMFromMap','function loadDEMFromMap','loadDEMFromMap=','async function fetchTerrainTile','function fetchTerrainTile','fetchTerrainTile=','openBudget16353','mapGrid16201','fallbackBudget16353','EARTHLINE_REGIONAL_TERRAIN_CACHE_16297','Open Terrarium elevation tiles','Mapbox Terrain-RGB']
lines=src.splitlines();out=[]
for pat in patterns:
    hits=[i for i,l in enumerate(lines) if pat in l];out.append(f'===== PATTERN: {pat} | HITS: {len(hits)} =====')
    for n,i in enumerate(hits,1):
        lo=max(0,i-140);hi=min(len(lines),i+220);out.append(f'--- HIT {n} lines {lo+1}-{hi} ---')
        out.extend(f'{j+1:06d}: {lines[j]}' for j in range(lo,hi))
Path('texas-publication-owner-extract.txt').write_text('\n'.join(out),encoding='utf-8')
print('wrote terrain owner trace')
