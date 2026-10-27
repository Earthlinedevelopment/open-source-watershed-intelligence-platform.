from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
lines=s.splitlines()
out=[]
for pat in ["function earthlinePrepareJurisdiction16539","function earthlinePointInJurisdiction16539","function earthlinePointInRing16539","function earthlineRingBounds16539"]:
    for i,l in enumerate(lines):
        if pat in l:
            lo=max(0,i-15); hi=min(len(lines),i+120)
            out.append(f"===== {pat} at {i+1} =====")
            out.extend(f"{j+1:06d}: {lines[j]}" for j in range(lo,hi))
Path("jurisdiction-point-owner-17292.txt").write_text("\n".join(out),encoding="utf-8")
print("sections",len([x for x in out if x.startswith("=====")]))
