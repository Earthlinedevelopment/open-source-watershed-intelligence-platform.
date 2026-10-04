from pathlib import Path

p=Path('index.html')
s=p.read_text(errors='ignore')
D='$'

s=s.replace(
    '<h2>A figure that remains useful outside the interface</h2>',
    '<h2>Hydrology and Bioswale Opportunity Plan</h2>',
    1
)

old_caption='Figure 1. Earthline screening map for this run. Green, gold, and rust lines are graded bioswale-opportunity corridors; blue lines are modeled surface-water paths; translucent blue areas show mapped aquifer context; contours and elevation labels show landform. Geometry is the frozen published output for this run. Screening only; field verification is required before design.'
new_caption='Figure 1. Hydrology and bioswale opportunity plan generated from the frozen published geometry for this run. Broad green, olive, and earth-toned bands are graded bioswale-opportunity corridors; blue lines show modeled surface-water movement; translucent blue fields show mapped aquifer context; contours and elevation labels describe landform. Screening only; field verification is required before design.'
if old_caption in s:
    s=s.replace(old_caption,new_caption,1)

s=s.replace(
    "metric('Mapped aquifer context',d.aquifers?.features??0,'Regional context only')",
    "metric('Mapped aquifer context',reportAquifers().length,'Regional context only')",
    1
)
old_count=D+"{num(d.aquifers?.features??0)} feature(s)."
new_count=D+"{num(reportAquifers().length)} feature(s)."
s=s.replace(old_count,new_count,1)

defs_anchor='<filter id="labelhalo"><feMorphology operator="dilate" radius="1.6" in="SourceAlpha" result="d"/>'
defs_insert='<filter id="paperTexture" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="2" seed="19" result="n"/><feColorMatrix in="n" type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .13"/></feComponentTransfer></filter><filter id="labelhalo"><feMorphology operator="dilate" radius="1.6" in="SourceAlpha" result="d"/>'
if defs_anchor not in s:
    raise SystemExit('report map defs anchor not found')
s=s.replace(defs_anchor,defs_insert,1)

bg_anchor='<rect width="'+D+'{W}" height="'+D+'{H}" fill="url(#elmapbg)"/><rect x="14" y="14"'
bg_insert='<rect width="'+D+'{W}" height="'+D+'{H}" fill="url(#elmapbg)"/><rect width="'+D+'{W}" height="'+D+'{H}" fill="#728678" opacity=".08" filter="url(#paperTexture)"/><rect x="14" y="14"'
if bg_anchor not in s:
    raise SystemExit('report map background anchor not found')
s=s.replace(bg_anchor,bg_insert,1)

oldlegend='if(aquiferFeatures.length||flows().length||rows.length)parts.push(\'<g transform="translate(\'+(W-224)+\',\'+(H-111)+\')"><rect width="202" height="47" rx="6" fill="#fbfcf8" fill-opacity=".94" stroke="#b7c5be" stroke-width=".7"/><rect x="10" y="9" width="17" height="7" rx="2" fill="rgba(92,170,202,.18)" stroke="#5e9fbd"/><text x="33" y="15" fill="#405760" font-size="7.2">Groundwater / aquifer context</text><path d="M10 27 H27" stroke="#5b9fc2" stroke-width="2.0"/><text x="33" y="30" fill="#405760" font-size="7.2">Water movement</text><path d="M104 12 H121" stroke="#4f8b5d" stroke-width="4.8"/><text x="127" y="15" fill="#405760" font-size="7.2">Planted bioswale</text><path d="M104 27 H121" stroke="#7b8a84" stroke-width=".5"/><text x="127" y="30" fill="#405760" font-size="7.2">Contour</text></g>\');'
newlegend='if(aquiferFeatures.length||flows().length||rows.length)parts.push(\'<g transform="translate(\'+(W-274)+\',\'+(H-118)+\')"><rect width="252" height="54" rx="7" fill="#fbfcf8" fill-opacity=".95" stroke="#b7c5be" stroke-width=".7"/><rect x="11" y="11" width="19" height="8" rx="2" fill="rgba(92,170,202,.18)" stroke="#5e9fbd"/><text x="37" y="18" fill="#405760" font-size="7.4">Mapped aquifer context</text><path d="M11 36 H30" stroke="#5b9fc2" stroke-width="2.0"/><text x="37" y="39" fill="#405760" font-size="7.4">Water movement</text><path d="M142 14 H163" stroke="#4f8b5d" stroke-width="4.8"/><text x="170" y="18" fill="#405760" font-size="7.4">Planted bioswale</text><path d="M142 36 H163" stroke="#7b8a84" stroke-width=".7"/><text x="170" y="39" fill="#405760" font-size="7.4">Contour / elevation</text></g>\');'
if oldlegend not in s:
    raise SystemExit('report map legend owner not found')
s=s.replace(oldlegend,newlegend,1)

p.write_text(s)
