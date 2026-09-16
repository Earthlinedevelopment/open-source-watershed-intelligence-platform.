from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
lines=src.splitlines()
anchors=['swaleCandidatesRaw','governedSwales','EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167']
printed=set()
for anchor in anchors:
    hits=[i for i,l in enumerate(lines) if anchor in l]
    print(f'===== {anchor} HITS {len(hits)} =====')
    for i in hits:
        lo=max(0,i-120); hi=min(len(lines),i+180)
        # collapse overlapping blocks
        if any(lo<=p<=hi for p in printed): continue
        printed.add(i)
        print(f'--- LINES {lo+1}-{hi} ---')
        for j in range(lo,hi):
            line=lines[j]
            if any(k in line.lower() for k in ['swale','candidate','corridor','slice(','spacing','rank','score','limit','max','govern','forbidmapped','publication','hydrology','recharge']):
                print(f'{j+1:06d}: {line}')
