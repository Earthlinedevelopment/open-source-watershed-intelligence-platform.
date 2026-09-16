from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
anchors=['let flows=makeFlows','genericBoundaryAudit16539','jurisdictionBoundaryPromise16539','await cameraSettle16310','visualData','settleRegionalCamera','earthlineClipVermontProducts16178','earthlineClipRegional','regionalOverlayRenderOk16336','phaseMark16198']
seen=set()
for anchor in anchors:
    hits=[i for i,l in enumerate(lines) if anchor.lower() in l.lower()]
    print(f'===== {anchor} HITS {len(hits)} {[(i+1) for i in hits[:12]]} =====')
    for i in hits[:5]:
        key=i//20
        if key in seen: continue
        seen.add(key)
        lo=max(0,i-24);hi=min(len(lines),i+46)
        print(f'--- LINES {lo+1}-{hi} ---')
        for j in range(lo,hi): print(f'{j+1:06d}: {lines[j]}')
