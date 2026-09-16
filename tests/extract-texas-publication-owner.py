from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
anchors=['async function loadDEM','function loadDEM','fetchTerrainTile','terrain.png','s3.amazonaws.com/elevation-tiles-prod/terrarium','Promise.all','async function hydrology','function hydrology','await wait(0)','heap','priority queue']
seen=set()
for anchor in anchors:
    hits=[i for i,l in enumerate(lines) if anchor.lower() in l.lower()]
    print(f'===== {anchor} HITS {len(hits)} {[(i+1) for i in hits[:20]]} =====')
    for i in hits[:5]:
        key=i//30
        if key in seen: continue
        seen.add(key)
        lo=max(0,i-36);hi=min(len(lines),i+100)
        print(f'--- LINES {lo+1}-{hi} ---')
        for j in range(lo,hi): print(f'{j+1:06d}: {lines[j]}')
