from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
anchors=['loadDEM','loadDEMFromMap','earthlineResolveLandValidity16584','function hydrology','function contours','function makeSwales','earthlineEnforceRegionalJurisdictionBoundary16539','earthlineRenderRegionalOverlay16020','EARTHLINE_REGIONAL_PERFORMANCE_16191','terrainProductsAndPublishMs','terrainMs']
seen=set()
for anchor in anchors:
    hits=[i for i,l in enumerate(lines) if anchor.lower() in l.lower()]
    print(f'===== {anchor} HITS {len(hits)} {[(i+1) for i in hits[:12]]} =====')
    for i in hits[:4]:
        key=i//20
        if key in seen: continue
        seen.add(key)
        lo=max(0,i-18);hi=min(len(lines),i+32)
        print(f'--- LINES {lo+1}-{hi} ---')
        for j in range(lo,hi): print(f'{j+1:06d}: {lines[j]}')
