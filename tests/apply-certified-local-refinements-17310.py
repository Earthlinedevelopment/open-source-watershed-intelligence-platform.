from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
pairs={
"makeSwales(h16702,c16702,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16702,c16702,false,earthlineBBoxCertifiedInterior16850(h16702.bounds,swaleJurisdictionGeometry16539)?{earthlineCertifiedInterior16850:true}:swaleJurisdictionGeometry16539,null)",
"makeSwales(h16730,c16730,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16730,c16730,false,earthlineBBoxCertifiedInterior16850(h16730.bounds,swaleJurisdictionGeometry16539)?{earthlineCertifiedInterior16850:true}:swaleJurisdictionGeometry16539,null)",
"makeSwales(h16780,c16780,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16780,c16780,false,earthlineBBoxCertifiedInterior16850(h16780.bounds,swaleJurisdictionGeometry16539)?{earthlineCertifiedInterior16850:true}:swaleJurisdictionGeometry16539,null)",
"makeSwales(h16731,c16731,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16731,c16731,false,earthlineBBoxCertifiedInterior16850(h16731.bounds,swaleJurisdictionGeometry16539)?{earthlineCertifiedInterior16850:true}:swaleJurisdictionGeometry16539,null)",
"makeSwales(h16741,c16741,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16741,c16741,false,earthlineBBoxCertifiedInterior16850(h16741.bounds,swaleJurisdictionGeometry16539)?{earthlineCertifiedInterior16850:true}:swaleJurisdictionGeometry16539,null)"
}
for old,new in pairs.items():
    n=s.count(old)
    if n!=1: raise SystemExit(f"anchor count {n}: {old}")
    s=s.replace(old,new,1)
s="<!-- EARTHLINE_CERTIFIED_LOCAL_REFINEMENTS_17310: exact boundary certification skips clipping only for refinement envelopes wholly interior to jurisdiction; final authoritative publication clip unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("certified all local Regional refinement envelopes 17310")
