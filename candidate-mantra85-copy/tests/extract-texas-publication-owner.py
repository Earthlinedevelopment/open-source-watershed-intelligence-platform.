from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
anchors=[
  'let contours=await makeContours(hy)',
  'let swales=makeSwales(hy,contours,focusMode,swaleJurisdictionGeometry16539)',
  'earthlineClipRegionalProducts16539',
  'earthlineRenderRegionalOverlay16020',
  'EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167',
  'terrainProductsAndPublishMs',
  'hy=await hydrology',
  'flows=earthlineFinalWaterClip16584'
]
low=src.lower()
for anchor in anchors:
    a=anchor.lower(); start=0; hits=[]
    while True:
        i=low.find(a,start)
        if i<0: break
        hits.append(i); start=i+1
    print(f'===== {anchor} HITS {len(hits)} =====')
    for n,i in enumerate(hits[:4],1):
        lo=max(0,i-1800); hi=min(len(src),i+4200)
        print(f'--- HIT {n} CHARS {lo}-{hi} ---')
        print(src[lo:hi])
        print('\n--- END HIT ---\n')
