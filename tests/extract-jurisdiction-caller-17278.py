from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
lines=s.splitlines()
patterns=["swaleJurisdictionGeometry16539","const boundary16539","earthlinePrepareJurisdiction16539","makeSwales(h16702","makeSwales(h16730","makeSwales(sub16839","makeSwales(h16780","makeSwales(h16731","makeSwales(h16741"]
out=[]
seen=set()
for pat in patterns:
    for i,l in enumerate(lines):
        if pat not in l: continue
        lo=max(0,i-35); hi=min(len(lines),i+70)
        key=(lo,hi)
        if key in seen: continue
        seen.add(key)
        out.append(f"===== {pat} at {i+1} =====")
        out.extend(f"{j+1:06d}: {lines[j]}" for j in range(lo,hi))
Path("jurisdiction-caller-17278.txt").write_text("\n".join(out),encoding="utf-8")
print("wrote",len(out),"lines")
