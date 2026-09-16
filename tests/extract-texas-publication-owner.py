from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
anchors=[
 ('function earthlineClipRegionalProducts16539',180,260),
 ('earthlineClipRegionalProducts16539=',180,260),
 ('function earthlinePointInJurisdiction16539',120,180),
 ('jurisdictionBoundaryPromise16539',180,240),
 ('jurisdictionCapability16539',180,240),
 ('let swales=makeSwales',100,160),
]
seen=[]
for anchor,before,after in anchors:
    hits=[i for i,l in enumerate(lines) if anchor.lower() in l.lower()]
    print(f'===== {anchor} HITS {len(hits)} =====')
    for i in hits[:4]:
        if any(abs(i-c)<80 for c in seen): continue
        seen.append(i)
        lo=max(0,i-before);hi=min(len(lines),i+after)
        print(f'--- LINES {lo+1}-{hi} ---')
        for j in range(lo,hi): print(f'{j+1:06d}: {lines[j]}')
