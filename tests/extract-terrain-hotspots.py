from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
patterns=[
    'async function loadDEM(',
    'function loadDEM(',
    'async function hydrology(',
    'function hydrology(',
    'function earthlineLandValidityMask16584',
    'openGrid16201',
    'openBudget16353',
    'Mapbox Terrain-RGB',
    'Open Terrarium elevation tiles'
]
out=[]
for pat in patterns:
    hits=[i for i,l in enumerate(lines) if pat in l]
    out.append(f'===== {pat} HITS {len(hits)} =====')
    for n,i in enumerate(hits,1):
        lo=max(0,i-100);hi=min(len(lines),i+260)
        out.append(f'--- hit {n} lines {lo+1}-{hi} ---')
        out.extend(f'{j+1:06d}: {lines[j]}' for j in range(lo,hi))
Path('terrain-owner-hotspots.txt').write_text('\n'.join(out),encoding='utf-8')
print('wrote terrain-owner-hotspots.txt')
