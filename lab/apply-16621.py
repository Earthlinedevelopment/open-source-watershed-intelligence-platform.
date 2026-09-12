from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
needle = 'function earthlineClipRegionalProducts16539'
start = s.find(needle)
if start < 0:
    raise SystemExit('guard failed: clip owner not found')
if s.find(needle, start + 1) >= 0:
    raise SystemExit('guard failed: multiple clip owners found')
brace = s.find('{', start)
if brace < 0:
    raise SystemExit('guard failed: opening brace not found')

depth=0; quote=None; escape=False; line_comment=False; block_comment=False; end=None; i=brace
while i < len(s):
    ch=s[i]; nxt=s[i+1] if i+1<len(s) else ''
    if line_comment:
        if ch=='\n': line_comment=False
    elif block_comment:
        if ch=='*' and nxt=='/': block_comment=False; i+=1
    elif quote:
        if escape: escape=False
        elif ch=='\\': escape=True
        elif ch==quote: quote=None
    else:
        if ch in ('\'', '"', '`'): quote=ch
        elif ch=='/' and nxt=='/': line_comment=True; i+=1
        elif ch=='/' and nxt=='*': block_comment=True; i+=1
        elif ch=='{': depth+=1
        elif ch=='}':
            depth-=1
            if depth==0: end=i+1; break
    i+=1
if end is None:
    raise SystemExit('guard failed: closing brace not found')

indent_start=s.rfind('\n',0,start)+1
indent=s[indent_start:start]
original=indent+'''function earthlineClipRegionalProducts16539(payload,boundary){
    const g=boundary&&(boundary.prepared||boundary.geometry);if(!g)throw new Error('administrative boundary geometry unavailable');
    const before={contours:Number(payload.contours&&payload.contours.features&&payload.contours.features.length||0),flows:Number(payload.flows&&payload.flows.features&&payload.flows.features.length||0),swales:Number(payload.swales&&payload.swales.features&&payload.swales.features.length||0)};
    const contours=earthlineClipFeatureCollection16539(payload.contours,g),flows=earthlineClipFeatureCollection16539(payload.flows,g),swales=earthlineRerankRegionalSwales16539(earthlineClipFeatureCollection16539(payload.swales,g));
    const after={contours:contours.features.length,flows:flows.features.length,swales:swales.features.length};
    const audit={build:'EARTHLINE 16539',runToken:payload.runToken||null,query:String(payload.query||''),placeType:boundary.placeType,capability:boundary.capability,source:boundary.source,sourceTier:boundary.sourceTier,sourceVintage:boundary.sourceVintage||null,before,after,removed:{contours:Math.max(0,before.contours-after.contours),flows:Math.max(0,before.flows-after.flows),swales:Math.max(0,before.swales-after.swales)},rule:'hydrology computed continuously on the full DEM envelope; only published Regional products are clipped to the selected administrative polygon',at:new Date().toISOString()};
    return {contours,flows,swales,audit};
  }'''

current=s[indent_start:end]
if 'EARTHLINE 16621 — CONTIGUOUS REGIONAL CLIP SEGMENTS' not in current:
    raise SystemExit('guard failed: incorrect 16621 function not present')
p.write_text(s[:indent_start]+original+s[end:],encoding='utf-8')
print('incorrect 16621 owner replacement rolled back')
