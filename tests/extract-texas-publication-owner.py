from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
anchors=[
 ('function makeSwales',40,260),
 ('pxToLL',80,160),
 ('segLL',100,180),
 ('cx:',100,160),
 ('potential:',100,160),
 ('chosen.push',140,160),
 ('capacity15970',160,180),
]
seen=[]
for anchor,before,after in anchors:
    hits=[i for i,l in enumerate(lines) if anchor.lower() in l.lower()]
    print(f'===== {anchor} HITS {len(hits)} =====')
    for i in hits[:6]:
        if any(abs(i-c)<60 for c in seen): continue
        seen.append(i)
        lo=max(0,i-before);hi=min(len(lines),i+after)
        print(f'--- LINES {lo+1}-{hi} ---')
        for j in range(lo,hi): print(f'{j+1:06d}: {lines[j]}')
