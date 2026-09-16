from pathlib import Path

src = Path('index.html').read_text(encoding='utf-8')
patterns = [
    'corridor rendering incomplete',
    'regionalOverlayRenderOk16336',
    'EARTHLINE_REGIONAL_CORRIDOR_LABEL_AUDIT_16336',
    'EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167',
    'terrainProductsAndPublishMs',
]

out=[]
lines=src.splitlines()
for pat in patterns:
    hits=[i for i,l in enumerate(lines) if pat in l]
    out.append(f'===== PATTERN: {pat} | HITS: {len(hits)} =====')
    for n,i in enumerate(hits,1):
        lo=max(0,i-70); hi=min(len(lines),i+90)
        out.append(f'--- HIT {n} lines {lo+1}-{hi} ---')
        for j in range(lo,hi):
            out.append(f'{j+1:06d}: {lines[j]}')

Path('texas-publication-owner-extract.txt').write_text('\n'.join(out),encoding='utf-8')
print('wrote texas-publication-owner-extract.txt')
