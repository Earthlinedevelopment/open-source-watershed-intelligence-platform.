from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='ignore')

pairs=[
("""fill="rgba(43,132,199,.25)" fill-rule="evenodd" stroke="#1d6faa" stroke-width="'+(small?1.9:2.35)+'" stroke-dasharray="7 3" vector-effect="non-scaling-stroke" opacity=".99" """.strip(),
 """fill="rgba(92,170,202,.16)" fill-rule="evenodd" stroke="#5e9fbd" stroke-width="'+(small?1.1:1.35)+'" vector-effect="non-scaling-stroke" opacity=".92" """.strip()),
('stroke="#8e9387" stroke-width=".58" opacity=".42"','stroke="#839186" stroke-width=".45" opacity=".25"'),
('stroke="#fffdfa" stroke-width="3.2" opacity=".86"','stroke="#ffffff" stroke-width="5.8" opacity=".72"'),
('stroke="#087bb4" stroke-width="1.8" opacity=".98"','stroke="#5b9fc2" stroke-width="2.15" opacity=".78"'),
("mainW=r.grade==='A'?4.2:r.grade==='B'?3.4:2.8","mainW=r.grade==='A'?6.8:r.grade==='B'?5.8:4.8"),
("haloW=mainW+1.15","haloW=mainW+4.0"),
("alpha=r.grade==='A'?'.98':r.grade==='B'?'.9':'.75'","alpha=r.grade==='A'?'.82':r.grade==='B'?'.72':'.6'"),
("const color=r.grade==='A'?'#177c58':r.grade==='B'?'#ad842e':'#aa6846'","const color=r.grade==='A'?'#4f8b5d':r.grade==='B'?'#789557':'#9b8b61'"),
('<stop offset="0" stop-color="#f7f4ea"/><stop offset="1" stop-color="#e7ece4"/>','<stop offset="0" stop-color="#f8f3e7"/><stop offset=".55" stop-color="#eef1e4"/><stop offset="1" stop-color="#dfe8dd"/>')
]
for old,new in pairs:
    if old in s:s=s.replace(old,new,1)

old="""parts.push('<path d="'+dpath+'" fill="none" stroke="#fffdf8" stroke-width="'+haloW+'" stroke-linecap="round" stroke-linejoin="round" opacity=".74"/><path d="'+dpath+'" fill="none" stroke="'+color+'" stroke-width="'+mainW+'" stroke-linecap="round" stroke-linejoin="round" opacity="'+alpha+'"/>')"""
new="""parts.push('<path d="'+dpath+'" fill="none" stroke="#dce8d7" stroke-width="'+haloW+'" stroke-linecap="round" stroke-linejoin="round" opacity=".78"/><path d="'+dpath+'" fill="none" stroke="'+color+'" stroke-width="'+mainW+'" stroke-linecap="round" stroke-linejoin="round" opacity="'+alpha+'"/><path d="'+dpath+'" fill="none" stroke="#f7f4de" stroke-width="'+Math.max(1.2,mainW*.20)+'" stroke-linecap="round" stroke-linejoin="round" opacity=".72" stroke-dasharray="1 5"/>')"""
if old in s:s=s.replace(old,new,1)

s=s.replace('Aquifer context</text><path d="M10 27 H27" stroke="#2188b2" stroke-width="1.2"/><text x="33" y="30" fill="#405760" font-size="7.2">Water path</text><path d="M104 12 H121" stroke="#177c58" stroke-width="2.2"/><text x="127" y="15" fill="#405760" font-size="7.2">Bioswale</text>',
            'Groundwater context</text><path d="M10 27 H27" stroke="#5b9fc2" stroke-width="1.8"/><text x="33" y="30" fill="#405760" font-size="7.2">Water movement</text><path d="M104 12 H121" stroke="#4f8b5d" stroke-width="5.2"/><text x="127" y="15" fill="#405760" font-size="7.2">Planted bioswale</text>',1)
p.write_text(s)
