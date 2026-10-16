from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

# Performance-only: local refinement windows generate terrain-derived candidate geometry
# without repeatedly clipping every provisional candidate to the full jurisdiction polygon.
# The existing authoritative full-grid makeSwales call still screens the consolidated
# supplemental candidate pool through screenJurisdictionCandidate16539 before any
# ranking/spacing/capacity/publication. No slope/flow/spacing/capacity rules change.
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
    raise SystemExit("expected at least five local refinement call anchors, got "+str(hits))

marker="/* EARTHLINE_CONSOLIDATED_JURISDICTION_SCREEN_17262 — local refinement candidate generation defers exact jurisdiction clipping to the existing authoritative consolidated makeSwales screen; science thresholds unchanged. */\n"
s=marker+s
p.write_text(s,encoding="utf-8")
print("replaced",hits)
