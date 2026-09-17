from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
anchors=[
  'let contours=await makeContours(hy)',
  'let swales=makeSwales(hy,contours,focusMode,swaleJurisdictionGeometry16539)',
  'earthlineClipRegionalProducts16539',
  'earthlineRenderRegionalOverlay16020',
  'EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167',
  'EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040',
  'terrainProductsAndPublishMs',
  'earthlineLandValidityMask16584',
  'hy=await hydrology',
  'await wait(0)'
]
seen=set()
for anchor in anchors:
    hits=[i for i,l in enumerate(lines) if anchor.lower() in l.lower()]
    print(f'===== {anchor} HITS {len(hits)} {[(i+1) for i in hits[:20]]} =====')
    for i in hits[:8]:
        key=(i//25,anchor)
        if key in seen: continue
        seen.add(key)
        lo=max(0,i-70);hi=min(len(lines),i+170)
        print(f'--- LINES {lo+1}-{hi} ---')
        for j in range(lo,hi): print(f'{j+1:06d}: {lines[j]}')
