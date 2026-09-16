from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
anchors=['EARTHLINE_SWALE_GENERATION_AUDIT_16167','chosenBeforeTierGate','nullReason','rejectedSpacing','selectedCorridors','rankedCorridors']
blocks=[]
for anchor in anchors:
    hits=[i for i,l in enumerate(lines) if anchor.lower() in l.lower()]
    print(f'===== {anchor} HITS {len(hits)} =====')
    for i in hits:
        lo=max(0,i-180); hi=min(len(lines),i+220)
        if any(not (hi<a or lo>b) for a,b in blocks):
            continue
        blocks.append((lo,hi))
        print(f'--- FULL BLOCK LINES {lo+1}-{hi} ---')
        for j in range(lo,hi): print(f'{j+1:06d}: {lines[j]}')
