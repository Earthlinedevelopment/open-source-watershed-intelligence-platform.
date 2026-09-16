from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
anchors=[
  'capacity15970',
  'EARTHLINE_SWALE_GENERATION_AUDIT_16167',
  'chosenBeforeTierGate',
  'rejectedSpacing',
  'rankedCorridors',
  'selectedCorridors',
  'EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539',
  'beforeClip',
  'afterClip',
  'jurisdiction',
  'clip',
  'EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167'
]
blocks=[]
for anchor in anchors:
    hits=[i for i,l in enumerate(lines) if anchor.lower() in l.lower()]
    print(f'===== {anchor} HITS {len(hits)} =====')
    for i in hits:
        lo=max(0,i-220); hi=min(len(lines),i+260)
        if any(not (hi<a or lo>b) for a,b in blocks):
            continue
        blocks.append((lo,hi))
        print(f'--- FULL BLOCK LINES {lo+1}-{hi} ---')
        for j in range(lo,hi): print(f'{j+1:06d}: {lines[j]}')
