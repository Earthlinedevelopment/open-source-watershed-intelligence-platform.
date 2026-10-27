from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
pairs={
"makeSwales(h16702,c16702,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16702,c16702,false,null,null)",
"makeSwales(h16730,c16730,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16730,c16730,false,null,null)",
"makeSwales(sub16839,c16839,false,swaleJurisdictionGeometry16539,null)":"makeSwales(sub16839,c16839,false,null,null)",
"makeSwales(h16780,c16780,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16780,c16780,false,null,null)",
"makeSwales(h16731,c16731,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16731,c16731,false,null,null)",
"makeSwales(h16741,c16741,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16741,c16741,false,null,null)"
}
for old,new in pairs.items():
    n=s.count(old)
    if n!=1: raise SystemExit(f"local refinement anchor count {n}: {old}")
    s=s.replace(old,new,1)
s="<!-- EARTHLINE_CONSOLIDATED_JURISDICTION_SCREEN_17317: six provisional local refinement generators no longer repeat full administrative clipping; final authoritative full-grid makeSwales + publication clipping remain unchanged/fail-closed. Combined with 17305/17315; no threshold, hydrology, ranking, spacing or capacity change. -->\n"+s
p.write_text(s,encoding="utf-8")
print("consolidated provisional jurisdiction screening 17317")
