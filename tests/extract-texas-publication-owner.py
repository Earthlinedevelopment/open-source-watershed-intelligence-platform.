from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
anchors=['function earthlinePrepareJurisdiction16539','function earthlinePointInJurisdiction16539','function earthlinePointInRing16539','function makeSwales','jurisdictionEligibleCount16539','jurisdictionRejectedCandidates16539','const chosen=[]','primarySpacing','earthlineClipLine16539','function earthlineClipFeatureCollection16539']
seen=set()
for anchor in anchors:
    hits=[i for i,l in enumerate(lines) if anchor.lower() in l.lower()]
    print(f'===== {anchor} HITS {len(hits)} {[(i+1) for i in hits[:12]]} =====')
    for i in hits[:4]:
        key=i//25
        if key in seen: continue
        seen.add(key)
        lo=max(0,i-28);hi=min(len(lines),i+64)
        print(f'--- LINES {lo+1}-{hi} ---')
        for j in range(lo,hi): print(f'{j+1:06d}: {lines[j]}')
