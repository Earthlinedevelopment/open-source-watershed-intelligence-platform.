from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
anchors=[
 ('capacity15970',120,180),
 ('EARTHLINE_SWALE_GENERATION_AUDIT_16167',120,180),
 ('chosenBeforeTierGate',120,180),
 ('EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539',160,220),
 ('EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167',120,180),
]
seen=[]
for anchor,before,after in anchors:
    hits=[i for i,l in enumerate(lines) if anchor.lower() in l.lower()]
    print(f'===== {anchor} HITS {len(hits)} =====')
    for i in hits[:4]:
        lo=max(0,i-before);hi=min(len(lines),i+after)
        if any(abs(i-c)<80 for c in seen): continue
        seen.append(i)
        print(f'--- LINES {lo+1}-{hi} ---')
        for j in range(lo,hi): print(f'{j+1:06d}: {lines[j]}')
