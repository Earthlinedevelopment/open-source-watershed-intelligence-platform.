from pathlib import Path
out=[]
for path in ["index.html","earthline-launch-16872.js"]:
    s=Path(path).read_text(encoding="utf-8")
    for needle in [
        "EARTHLINE 16236",
        "earthlineGovernedPropertyRun16202",
        "directGovernedPropertyOwnerUsed",
        "EARTHLINE_PROPERTY_RUN_AUDIT_16173",
        "EARTHLINE_PROPERTY_TARGET_16201",
        "earthlineDeclarePropertyAtCrosshair16173",
        "earthlineSyncPropertyTargetFromMap16201"
    ]:
        start=0
        while True:
            i=s.find(needle,start)
            if i<0: break
            out.append(f"===== {path} :: {needle} @ {i} =====\n"+s[max(0,i-9000):i+18000])
            start=i+1
Path("property-owner-17422.txt").write_text("\n\n".join(out),encoding="utf-8")
print("sections",len(out))
