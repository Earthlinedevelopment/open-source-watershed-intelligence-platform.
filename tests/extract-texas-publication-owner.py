from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
anchors=[
 ('const spacing=focusMode?6:8',120,220),
 ('chosen.every',120,220),
 ('secondary',120,220),
 ('target=',120,220),
 ('capacity15970',120,220),
 ('rejectedSpacing',120,220),
]
seen=[]
for anchor,before,after in anchors:
    hits=[i for i,l in enumerate(lines) if anchor.lower() in l.lower()]
    print(f'===== {anchor} HITS {len(hits)} =====')
    for i in hits[:6]:
        if any(abs(i-c)<40 for c in seen): continue
        seen.append(i)
        lo=max(0,i-before);hi=min(len(lines),i+after)
        print(f'--- LINES {lo+1}-{hi} ---')
        for j in range(lo,hi): print(f'{j+1:06d}: {lines[j]}')
