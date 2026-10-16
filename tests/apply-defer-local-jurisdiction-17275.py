from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
repls={
"makeSwales(h16702,c16702,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16702,c16702,false,null,null)",
"makeSwales(h16730,c16730,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16730,c16730,false,null,null)",
"makeSwales(sub16839,c16839,false,swaleJurisdictionGeometry16539,null)":"makeSwales(sub16839,c16839,false,null,null)",
"makeSwales(h16780,c16780,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16780,c16780,false,null,null)",
"makeSwales(h16731,c16731,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16731,c16731,false,null,null)",
"makeSwales(h16741,c16741,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16741,c16741,false,null,null)"
}
hits=0
for old,new in repls.items():
    n=s.count(old)
    print(old,n)
    if n:
        s=s.replace(old,new)
        hits+=n
if hits<5:
    raise SystemExit("expected at least five current local refinement anchors, got "+str(hits))
marker="<!-- EARTHLINE_DEFER_LOCAL_JURISDICTION_17275: provisional local candidates defer exact jurisdiction clipping to final authoritative full-grid makeSwales; no science thresholds changed. -->\n"
s=marker+s
p.write_text(s,encoding="utf-8")
print("deferred local jurisdiction screens",hits)
