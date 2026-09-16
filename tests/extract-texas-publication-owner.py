from pathlib import Path
src=Path('index.html').read_text(encoding='utf-8')
patterns=['function settleRegionalCamera','settleRegionalCamera=','settleRegionalCamera(','function project(','const project=','function points(','const points=','function clearLive','clearLive=','cameraSettle16310','EARTHLINE_REGIONAL_CAMERA_AUDIT_16147','function render(data)','earthlineRenderRegionalOverlay16020','EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040','corridor rendering incomplete']
lines=src.splitlines();out=[]
for pat in patterns:
    hits=[i for i,l in enumerate(lines) if pat in l];out.append(f'===== PATTERN: {pat} | HITS: {len(hits)} =====')
    for n,i in enumerate(hits,1):
        lo=max(0,i-120);hi=min(len(lines),i+170);out.append(f'--- HIT {n} lines {lo+1}-{hi} ---')
        out.extend(f'{j+1:06d}: {lines[j]}' for j in range(lo,hi))
Path('texas-publication-owner-extract.txt').write_text('\n'.join(out),encoding='utf-8')
print('wrote texas-publication-owner-extract.txt')
