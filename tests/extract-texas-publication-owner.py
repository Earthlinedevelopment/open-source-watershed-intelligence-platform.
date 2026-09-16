from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
anchors=[
 ('jurisdictionBoundaryPromise16539',60,110),
 ('let swales=makeSwales',55,95),
 ('const boundary16539=await jurisdictionBoundaryPromise16539',45,75),
 ('earthlineClipRegionalProducts16539',35,65),
]
seen=[]
for anchor,before,after in anchors:
    hits=[i for i,l in enumerate(lines) if anchor.lower() in l.lower()]
    print(f'===== {anchor} HITS {len(hits)} =====')
    for i in hits[:5]:
        if any(abs(i-c)<35 for c in seen): continue
        seen.append(i)
        lo=max(0,i-before);hi=min(len(lines),i+after)
        print(f'--- LINES {lo+1}-{hi} ---')
        for j in range(lo,hi): print(f'{j+1:06d}: {lines[j]}')
