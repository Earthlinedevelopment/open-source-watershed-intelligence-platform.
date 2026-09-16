from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
anchors=[
 ('async function loadDEM',160,260),
 ('function loadDEM(',160,260),
 ('async function loadDEMFromMap',160,260),
 ('function loadDEMFromMap',160,260),
 ('earthlineResolveLandValidity16584',140,220),
 ('function hydrology',140,260),
 ('function contours',120,220),
 ('function makeSwales',180,360),
 ('earthlineEnforceRegionalJurisdictionBoundary16539',140,220),
 ('earthlineRenderRegionalOverlay16020',140,240),
 ('EARTHLINE_REGIONAL_PERFORMANCE_16191',220,300),
 ('terrainProductsAndPublishMs',220,300),
 ('terrainMs',220,300),
]
seen=[]
for anchor,before,after in anchors:
    hits=[i for i,l in enumerate(lines) if anchor.lower() in l.lower()]
    print(f'===== {anchor} HITS {len(hits)} =====')
    for i in hits[:8]:
        if any(abs(i-c)<80 for c in seen): continue
        seen.append(i)
        lo=max(0,i-before);hi=min(len(lines),i+after)
        print(f'--- LINES {lo+1}-{hi} ---')
        for j in range(lo,hi): print(f'{j+1:06d}: {lines[j]}')
