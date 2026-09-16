from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
patterns=['earthlineRenderRegionalOverlay16020','function render(data)','corridor rendering incomplete','EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167','EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040','cameraSettle16310','cameraReadyBeforePublishMs','await cameraSettle16310','renderedCorridors','overlaySwaleLines','publishTerrainOnly','terrainProductsAndPublishMs']
lines=src.splitlines();out=[]
for pat in patterns:
    hits=[i for i,l in enumerate(lines) if pat in l];out.append(f'===== PATTERN: {pat} | HITS: {len(hits)} =====')
    for n,i in enumerate(hits,1):
        lo=max(0,i-180);hi=min(len(lines),i+260);out.append(f'--- HIT {n} lines {lo+1}-{hi} ---')
        out.extend(f'{j+1:06d}: {lines[j]}' for j in range(lo,hi))
Path('texas-publication-owner-extract.txt').write_text('\n'.join(out),encoding='utf-8')
print('wrote renderer/publication owner trace')
