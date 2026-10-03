from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(errors='ignore')

pat_owner=re.compile(r"function reportAquifers\\(\\)\\{[\\s\\S]*?\\}\\s*function graded\\(\\)")
m=pat_owner.search(s)
if not m: raise SystemExit('reportAquifers owner not found')
s=s[:m.start()]+new+"   function graded()"+s[m.end():]

old2="""const aquiferSvg=aquiferFeatures.map((f,i)=>{const g=f&&f.geometry;if(!g)return '';const polys=g.type==='Polygon'?[g.coordinates]:(g.type==='MultiPolygon'?g.coordinates:[]);return polys.map(poly=>{if(!Array.isArray(poly)||!poly.length)return '';const rings=poly.filter(r=>Array.isArray(r)&&r.length>=3);if(!rings.length)return '';const dpath=rings.map(r=>pathCoords(r)+' Z').join(' ');return '<path d="'+dpath+'" fill="rgba(35,126,196,.22)" fill-rule="evenodd" stroke="#236fa8" stroke-width="'+(small?1.8:2.15)+'" stroke-dasharray="7 3" vector-effect="non-scaling-stroke" opacity=".98"><title>'+esc(f.properties?.name||'Mapped aquifer context')+' — context only</title></path>'}).join('')}).join('');"""
new2="""const aquiferSvg=aquiferFeatures.map((f,i)=>{const g=f&&f.geometry;if(!g)return '';const polys=g.type==='Polygon'?[g.coordinates]:(g.type==='MultiPolygon'?g.coordinates:[]);return polys.map(poly=>{if(!Array.isArray(poly)||!poly.length)return '';const rings=poly.filter(r=>Array.isArray(r)&&r.length>=3);if(!rings.length)return '';const dpath=rings.map(r=>pathCoords(r)+' Z').join(' '),outer=rings[0],cx=outer.reduce((a,p)=>a+Number(p[0]||0),0)/outer.length,cy=outer.reduce((a,p)=>a+Number(p[1]||0),0)/outer.length,visible=inside([cx,cy]);return '<path d="'+dpath+'" fill="rgba(58,142,199,.18)" fill-rule="evenodd" stroke="#2f78a8" stroke-width="'+(small?1.5:1.8)+'" vector-effect="non-scaling-stroke" opacity=".95"><title>'+esc(f.properties?.name||'Mapped aquifer context')+' — context only</title></path>'+(visible?'<g class="el-report-aquifer-label"><rect x="'+(sx(cx)-42).toFixed(1)+'" y="'+(sy(cy)-9).toFixed(1)+'" width="84" height="15" rx="4" fill="#f7fbfd" fill-opacity=".9" stroke="#7fb1cf" stroke-width=".6"/><text x="'+sx(cx).toFixed(1)+'" y="'+(sy(cy)+1.5).toFixed(1)+'" text-anchor="middle" fill="#1f5f86" font-size="'+(small?6.7:7.5)+'" font-weight="800">AQUIFER CONTEXT</text></g>':'')}).join('')}).join('');"""
if old2 not in s: raise SystemExit('aquifer SVG exact owner not found')
s=s.replace(old2,new2,1)

s=s.replace('stroke="#74847e" stroke-width=".58" opacity=".43"','stroke="#7f8c87" stroke-width=".34" opacity=".20"',1)
s=s.replace('stroke="#f8fdff" stroke-width="3.4" opacity=".84"','stroke="#ffffff" stroke-width="1.8" opacity=".48"',1)
s=s.replace('stroke="#087fb8" stroke-width="1.75" opacity=".98"','stroke="#1889b7" stroke-width=".9" opacity=".74"',1)

pat=re.compile(r"const rows=graded\(\);for\(const r of rows\)\{[\s\S]*?\}\)\s*\}\s*if\(isVermont\)for")
m=pat.search(s)
if not m: raise SystemExit('swale render block not found')
new3="""const rows=graded();for(const r of rows){const color=r.grade==='A'?'#18875f':r.grade==='B'?'#b4872d':'#b7683b',mainW=r.grade==='A'?2.15:r.grade==='B'?1.75:1.45,haloW=mainW+1.35,dpath=smoothPath(r.f);parts.push('<path d="'+dpath+'" fill="none" stroke="#fffdf8" stroke-width="'+haloW+'" stroke-linecap="round" stroke-linejoin="round" opacity=".88"/><path d="'+dpath+'" fill="none" stroke="'+color+'" stroke-width="'+mainW+'" stroke-linecap="round" stroke-linejoin="round" opacity="'+(r.grade==='C'?'.62':'.86')+'"/>')}     if(isVermont)for"""
s=s[:m.start()]+new3+s[m.end():]

p.write_text(s)
