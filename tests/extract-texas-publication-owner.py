from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
patterns=[
'swaleCandidatesRaw','governedSwales','forbidMappedWaterCrossings','EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167',
'objectToFeatureCollection','rechargeCorridors','regionalSwales','swaleCandidates','swale opportunities','ranked swale',
'candidateLimit','maxCandidates','maxSwales','MAX_SWALES','slice(0','spacing','rejectedSpacing','corridor',
'buildSwale','generateSwale','selectSwale','rankSwale','scoreSwale','recharge target','rechZones',
'EARTHLINE_REGIONAL_VISUAL_DATA_16020','earthlineClipRegionalProducts16539({contours,flows,swales'
]
lines=src.splitlines();out=[];seen=[]
for pat in patterns:
    hits=[i for i,l in enumerate(lines) if pat.lower() in l.lower()]
    out.append(f'===== PATTERN: {pat} | HITS: {len(hits)} =====')
    for n,i in enumerate(hits,1):
        lo=max(0,i-180);hi=min(len(lines),i+260)
        if any(abs(lo-a)<80 and abs(hi-b)<80 for a,b in seen):
            continue
        seen.append((lo,hi))
        out.append(f'--- HIT {n} lines {lo+1}-{hi} ---')
        out.extend(f'{j+1:06d}: {lines[j]}' for j in range(lo,hi))
Path('texas-corridor-selection-owner-extract.txt').write_text('\n'.join(out),encoding='utf-8')
print('wrote Texas shared corridor selection owner trace')
