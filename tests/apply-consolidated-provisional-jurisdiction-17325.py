from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
anchors=[
("makeSwales(h16702,c16702,false,swaleJurisdictionGeometry16539,null)","makeSwales(h16702,c16702,false,null,null)"),
("makeSwales(h16730,c16730,false,swaleJurisdictionGeometry16539,null)","makeSwales(h16730,c16730,false,null,null)"),
("makeSwales(h16780,c16780,false,swaleJurisdictionGeometry16539,null)","makeSwales(h16780,c16780,false,null,null)"),
("makeSwales(h16731,c16731,false,swaleJurisdictionGeometry16539,null)","makeSwales(h16731,c16731,false,null,null)"),
("makeSwales(h16741,c16741,false,swaleJurisdictionGeometry16539,null)","makeSwales(h16741,c16741,false,null,null)")
]
for old,new in anchors:
    n=s.count(old)
    if n!=1: raise SystemExit(f"anchor {old} count {n}")
    s=s.replace(old,new,1)
sub_options=[
"makeSwales(sub16839,c16839,false,jurisdiction16850,null)",
"makeSwales(sub16839,c16839,false,swaleJurisdictionGeometry16539,null)"
]
hits=[a for a in sub_options if s.count(a)==1]
if len(hits)!=1: raise SystemExit(f"supertile provisional anchor hits {[(a,s.count(a)) for a in sub_options]}")
s=s.replace(hits[0],"makeSwales(sub16839,c16839,false,null,null)",1)
s="<!-- EARTHLINE_CONSOLIDATED_PROVISIONAL_JURISDICTION_17325: six provisional refinement makeSwales calls defer jurisdiction clipping to the existing final authoritative Regional publication screen; hydrology/ranking/spacing/capacity unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("consolidated provisional jurisdiction screening 17325")
