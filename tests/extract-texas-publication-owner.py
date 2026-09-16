from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
anchors=['swaleJurisdictionGeometry16539','makeSwales(hy,contours','selectionBoundary16539=await jurisdictionBoundaryPromise16539','boundary16539.prepared','boundary.prepared||boundary.geometry']
for anchor in anchors:
    hits=[i for i,l in enumerate(lines) if anchor.lower() in l.lower()]
    print(f'===== {anchor} HITS {len(hits)} {[(i+1) for i in hits[:20]]} =====')
    for i in hits[:6]:
        lo=max(0,i-10);hi=min(len(lines),i+18)
        print(f'--- LINES {lo+1}-{hi} ---')
        for j in range(lo,hi): print(f'{j+1:06d}: {lines[j]}')
