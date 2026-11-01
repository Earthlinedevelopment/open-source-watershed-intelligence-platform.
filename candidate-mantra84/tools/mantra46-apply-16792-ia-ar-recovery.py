from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

marker="<!-- EARTHLINE 16791 — CORRECTED REGIONAL AUDIT SEMANTICS."
comment="<!-- EARTHLINE 16792 — IOWA/ARKANSAS REGIONAL RECOVERY. Two evidence-backed global repairs only: (1) cached Regional state packages rebind the authoritative LAST_ATOMIC package on every cache hit, preventing stale prior-state identity during repeated state switching; (2) Regional candidate generation always runs the existing relaxed contour pass, constrained to the existing <=4% low-relief opportunity band, so statewide high-relief candidate abundance cannot suppress real low-relief candidates elsewhere. Property behavior, mapped-water safety, jurisdiction containment, ranking, capacity and renderers are unchanged. CANDIDATE / NOT ACCEPTED. -->\n"
if "EARTHLINE 16792 — IOWA/ARKANSAS REGIONAL RECOVERY" not in s:
    n=s.count(marker)
    if n!=1: raise SystemExit(f"16791 marker expected once, found {n}")
    s=s.replace(marker,comment+marker,1)

old1="if(earthlineAtomicStatePackageCache16556.has(profile16556.id))return earthlineAtomicStatePackageCache16556.get(profile16556.id);"
new1="if(earthlineAtomicStatePackageCache16556.has(profile16556.id)){const cached16556=earthlineAtomicStatePackageCache16556.get(profile16556.id);window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556=cached16556;return cached16556;}"
n=s.count(old1)
if n!=1: raise SystemExit(f"atomic cache-hit owner expected once, found {n}")
s=s.replace(old1,new1,1)

old2="const slope=hy.slope[i],acc=hy.acc[i],minSlope=relaxed?.05:.20,maxSlope=relaxed?18:13.5;"
new2="const slope=hy.slope[i],acc=hy.acc[i],minSlope=relaxed?.05:.20,maxSlope=relaxed?(focusMode?18:4):13.5;"
n=s.count(old2)
if n!=1: raise SystemExit(f"relaxed slope owner expected once, found {n}")
s=s.replace(old2,new2,1)

old3="if(preferredEligibleCount16539<36){"
new3="if(!focusMode||preferredEligibleCount16539<36){"
n=s.count(old3)
if n!=1: raise SystemExit(f"relaxed pass gate expected once, found {n}")
s=s.replace(old3,new3,1)

p.write_text(s,encoding="utf-8")
print("EARTHLINE 16792 installer applied")
