from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
lines=s.splitlines()
out=[]
for pat in ["async function makeContours","async function makeSwales","function makeContours","function makeSwales"]:
    for i,l in enumerate(lines):
        if pat in l:
            lo=max(0,i-5); hi=min(len(lines),i+260)
            out.append(f"===== {pat} at {i+1} =====")
            out.extend(f"{j+1:06d}: {lines[j]}" for j in range(lo,hi))
Path("contour-swale-owner-17290.txt").write_text("\n".join(out),encoding="utf-8")
print("matches",sum(1 for l in lines if "makeContours" in l or "makeSwales" in l))
