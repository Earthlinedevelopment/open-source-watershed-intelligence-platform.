from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(errors='ignore')

# TASK 1: professionalize the one report map without changing analysis geometry.
repls=[
('<stop offset="0" stop-color="#f7f4ea"/><stop offset="1" stop-color="#e7ece4"/>',
 '<stop offset="0" stop-color="#faf6ec"/><stop offset=".58" stop-color="#eef1e5"/><stop offset="1" stop-color="#dfe8dd"/>'),
('fill="rgba(43,132,199,.25)" fill-rule="evenodd" stroke="#1d6faa" stroke-width="'+(small?1.9:2.35)+'" stroke-dasharray="7 3" vector-effect="non-scaling-stroke" opacity=".99"',
 'fill="rgba(92,170,202,.18)" fill-rule="evenodd" stroke="#5e9fbd" stroke-width="'+(small?1.15:1.45)+'" vector-effect="non-scaling-stroke" opacity=".94"'),
('stroke="#7f8b83" stroke-width=".62" opacity=".44"',
 'stroke="#839186" stroke-width=".48" opacity=".30"'),
('stroke="#fffdfa" stroke-width="3.2" opacity=".88"',
 'stroke="#ffffff" stroke-width="5.0" opacity=".70"'),
('stroke="#087bb4" stroke-width="1.85" opacity=".98"',
 'stroke="#5b9fc2" stroke-width="2.15" opacity=".86"'),
('<rect x="10" y="9" width="17" height="7" rx="2" fill="rgba(69,151,207,.17)" stroke="#3f83ad"/>',
 '<rect x="10" y="9" width="17" height="7" rx="2" fill="rgba(92,170,202,.18)" stroke="#5e9fbd"/>'),
('>Aquifer context</text>','>Groundwater / aquifer context</text>'),
('stroke="#2188b2" stroke-width="1.2"','stroke="#5b9fc2" stroke-width="2.0"'),
('>Water path</text>','>Water movement</text>'),
('stroke="#177c58" stroke-width="2.2"','stroke="#4f8b5d" stroke-width="4.8"'),
('>Bioswale</text>','>Planted bioswale</text>')
]
for old,new in repls:
    if old in s:
        s=s.replace(old,new,1)

# Remove the repeated per-feature aquifer labels. The polygon field + legend carry the meaning.
if 'return shapes+label;' in s:
    s=s.replace('return shapes+label;','return shapes;',1)

# Strengthen bioswales as designed landscape interventions while preserving exact corridor geometry.
old="""const rows=graded();for(const r of rows){const color=r.grade==='A'?'#177c58':r.grade==='B'?'#ad842e':'#aa6846',mainW=r.grade==='A'?4.35:r.grade==='B'?3.55:2.9,haloW=mainW+2.2,alpha=r.grade==='A'?'.98':r.grade==='B'?'.9':'.74',dpath=smoothPath(r.f);parts.push('<path d="'+dpath+'" fill="none" stroke="#fffdf8" stroke-width="'+haloW+'" stroke-linecap="round" stroke-linejoin="round" opacity=".74"/><path d="'+dpath+'" fill="none" stroke="'+color+'" stroke-width="'+mainW+'" stroke-linecap="round" stroke-linejoin="round" opacity="'+alpha+'"/>')}"""
new="""const rows=graded();for(const r of rows){const color=r.grade==='A'?'#4f8b5d':r.grade==='B'?'#789557':'#9b8b61',mainW=r.grade==='A'?6.4:r.grade==='B'?5.4:4.5,haloW=mainW+4.0,alpha=r.grade==='A'?'.88':r.grade==='B'?'.78':'.66',dpath=smoothPath(r.f);parts.push('<path d="'+dpath+'" fill="none" stroke="#dbe8d5" stroke-width="'+haloW+'" stroke-linecap="round" stroke-linejoin="round" opacity=".82"/><path d="'+dpath+'" fill="none" stroke="'+color+'" stroke-width="'+mainW+'" stroke-linecap="round" stroke-linejoin="round" opacity="'+alpha+'"/><path d="'+dpath+'" fill="none" stroke="#f7f1cf" stroke-width="'+Math.max(1.1,mainW*.18)+'" stroke-linecap="round" stroke-linejoin="round" opacity=".62" stroke-dasharray="1 5"/>')}"""
if old not in s:
    raise SystemExit('current bioswale render owner not found')
s=s.replace(old,new,1)

# TASK 2: fix How Bioswales Work hierarchy. No broken section-number references.
s=s.replace("'How to read this':'The core idea'","'How to read this':'The idea in one minute'",1)

marker="""bh.querySelectorAll('h2,h3').forEach(h=>{             let t=String(h.textContent||'').trim().replace(/^§\d+\s*·\s*/,'').replace(/^\d+\.\d+\s*·\s*/,'');             h.textContent=map16940[t]||t;           });"""
if marker not in s:
    raise SystemExit('How Swales heading normalization owner not found')
insert=marker+"""           const coreHeading=[...bh.querySelectorAll('h2')].find(h=>String(h.textContent||'').trim()==='The idea in one minute');           if(coreHeading){             let n=coreHeading.nextSibling,remove=[];             while(n&&!(n.nodeType===1&&n.tagName==='H2')){remove.push(n);n=n.nextSibling}             remove.forEach(x=>x.remove());             coreHeading.insertAdjacentHTML('afterend','<p><strong>Start with the images above.</strong> They show the physical idea: hold water in the landscape long enough for soil, roots, vegetation, and groundwater systems to use it.</p><p>This page then follows one story in order: what happens when water leaves too quickly; what a bioswale changes; where infiltrated water goes; why position matters; how the larger landscape responds; and what the evidence can and cannot support.</p><p>Measured and modeled evidence is identified where it appears. The Corrections Registry and the complete source list are kept at the end so the main explanation stays readable.</p>');           }"""
s=s.replace(marker,insert,1)

p.write_text(s)
