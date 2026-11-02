from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
patterns=['function makeSwales(','function earthlineClipRegionalProducts16539','function earthlineClipLine16539','function earthlinePointInJurisdiction16539','jurisdiction_screened:true','const chosen=[],primarySpacing']
out=[]
for pat in patterns:
    hits=[i for i,l in enumerate(lines) if pat in l]
    out.append(f'===== {pat} HITS {len(hits)} =====')
    for n,i in enumerate(hits,1):
        lo=max(0,i-80);hi=min(len(lines),i+220)
        out.append(f'--- hit {n} lines {lo+1}-{hi} ---')
        out.extend(f'{j+1:06d}: {lines[j]}' for j in range(lo,hi))
Path('texas-hotspots-extract.txt').write_text('\n'.join(out),encoding='utf-8')
print('wrote texas-hotspots-extract.txt')
