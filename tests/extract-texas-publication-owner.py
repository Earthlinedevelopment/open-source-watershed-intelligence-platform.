from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
patterns=[
'function earthlineAdministrativeCapability16539','earthlineAdministrativeCapability16539=',
'function earthlineResolveJurisdictionBoundary16539','earthlineResolveJurisdictionBoundary16539=',
'function earthlineClipRegionalProducts16539','earthlineClipRegionalProducts16539=',
'function earthlineJurisdictionProfile16549','earthlineJurisdictionProfile16549=',
'EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556','appliedAtomically',
'EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539',
'earthlineClipRegionalProducts16539({contours,flows,swales',
'watershed','basin','hydrography','regional-water','regionalWater','watershed-boundary',
'earthlineRenderRegionalOverlay16020','EARTHLINE_REGIONAL_VISUAL_DATA_16020',
'guardedSetGeo(runToken,m,IDS.swales','guardedSetGeo(runToken,m,IDS.flows',
'query:q,bounds:b,boundsHash:bHash,contours,flows,swales'
]
lines=src.splitlines();out=[]
seen=set()
for pat in patterns:
    hits=[i for i,l in enumerate(lines) if pat in l]
    out.append(f'===== PATTERN: {pat} | HITS: {len(hits)} =====')
    for n,i in enumerate(hits,1):
        key=(max(0,i-220),min(len(lines),i+340))
        if key in seen: continue
        seen.add(key)
        lo,hi=key
        out.append(f'--- HIT {n} lines {lo+1}-{hi} ---')
        out.extend(f'{j+1:06d}: {lines[j]}' for j in range(lo,hi))
Path('texas-containment-owner-extract.txt').write_text('\n'.join(out),encoding='utf-8')
print('wrote shared jurisdiction containment trace')
