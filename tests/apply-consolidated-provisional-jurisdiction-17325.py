from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
anchors=[
"makeSwales(h16702,c16702,false,swaleJurisdictionGeometry16539,null)",
"makeSwales(h16730,c16730,false,swaleJurisdictionGeometry16539,null)",
"makeSwales(sub16839,c16839,false,swaleJurisdictionGeometry16539,null)",
"makeSwales(h16780,c16780,false,swaleJurisdictionGeometry16539,null)",
"makeSwales(h16731,c16731,false,swaleJurisdictionGeometry16539,null)",
"makeSwales(h16741,c16741,false,swaleJurisdictionGeometry16539,null)"
]
for a in anchors:
    n=s.count(a)
    if n!=1: raise SystemExit(f"anchor {a} count {n}")
    s=s.replace(a,a.replace("swaleJurisdictionGeometry16539","null"),1)
s="<!-- EARTHLINE_CONSOLIDATED_PROVISIONAL_JURISDICTION_17325: six provisional refinement makeSwales calls defer jurisdiction clipping to the existing final authoritative Regional publication screen; hydrology/ranking/spacing/capacity unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("consolidated provisional jurisdiction screening 17325")
