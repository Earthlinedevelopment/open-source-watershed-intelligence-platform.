from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
marker = 'EARTHLINE 16621 — CONTIGUOUS REGIONAL CLIP SEGMENTS'
if marker in s:
    print('16621 already present')
    raise SystemExit(0)

needle = 'function earthlineClipRegionalProducts16539'
start = s.find(needle)
if start < 0:
    raise SystemExit('guard failed: clip owner not found')
if s.find(needle, start + 1) >= 0:
    raise SystemExit('guard failed: multiple clip owners found')
brace = s.find('{', start)
if brace < 0:
    raise SystemExit('guard failed: clip owner opening brace not found')

depth = 0
quote = None
escape = False
line_comment = False
block_comment = False
i = brace
end = None
while i < len(s):
    ch = s[i]
    nxt = s[i + 1] if i + 1 < len(s) else ''
    if line_comment:
        if ch == '\n': line_comment = False
    elif block_comment:
        if ch == '*' and nxt == '/':
            block_comment = False
            i += 1
    elif quote:
        if escape:
            escape = False
        elif ch == '\\':
            escape = True
        elif ch == quote:
            quote = None
    else:
        if ch in ('\'', '"', '`'):
            quote = ch
        elif ch == '/' and nxt == '/':
            line_comment = True
            i += 1
        elif ch == '/' and nxt == '*':
            block_comment = True
            i += 1
        elif ch == '{':
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    i += 1
if end is None:
    raise SystemExit('guard failed: clip owner closing brace not found')

indent_start = s.rfind('\n', 0, start) + 1
indent = s[indent_start:start]
new = indent + '''function earthlineClipRegionalProducts16539(water,swales,center,contains){
    /* EARTHLINE 16621 — CONTIGUOUS REGIONAL CLIP SEGMENTS.
       A rejected vertex terminates a LineString run. Never reconnect surviving
       coordinates across jurisdiction, land-validity, or other rejected gaps. */
    const finite=p=>Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]);
    const nearestIndex=(dem,lng,lat)=>{
      if(!dem||!dem.w||!dem.h)return -1;
      const gx=(lng-dem.bbox.w)/((dem.bbox.e-dem.bbox.w)||1)*(dem.w-1);
      const gy=(dem.bbox.n-lat)/((dem.bbox.n-dem.bbox.s)||1)*(dem.h-1);
      const x=Math.max(0,Math.min(dem.w-1,Math.round(gx)));
      const y=Math.max(0,Math.min(dem.h-1,Math.round(gy)));
      return y*dem.w+x;
    };
    const pointAllowed=p=>{
      if(!finite(p))return false;
      if(contains&&!contains(p[0],p[1]))return false;
      const idx=nearestIndex(M.dem,p[0],p[1]);
      return idx<0||earthlineCellLandValid16538(idx);
    };
    const sanitize=fc=>{
      const out=[];
      for(const f of (fc&&fc.features||[])){
        const g=f&&f.geometry;
        if(!g)continue;
        if(g.type==='Point'){
          if(pointAllowed(g.coordinates))out.push(f);
          continue;
        }
        if(g.type==='LineString'){
          let run=[];
          const flush=()=>{
            if(run.length>=2)out.push({...f,geometry:{...g,coordinates:run}});
            run=[];
          };
          for(const p of (g.coordinates||[])){
            if(pointAllowed(p))run.push(p);
            else flush();
          }
          flush();
          continue;
        }
        out.push(f);
      }
      return {...fc,features:out};
    };
    return {water:sanitize(water),swales:sanitize(swales)};
  }'''

new_s = s[:indent_start] + new + s[end:]
if marker not in new_s:
    raise SystemExit('guard failed: replacement marker missing')
p.write_text(new_s, encoding='utf-8')
print(f'16621 mutation applied at bytes {indent_start}:{end}')
