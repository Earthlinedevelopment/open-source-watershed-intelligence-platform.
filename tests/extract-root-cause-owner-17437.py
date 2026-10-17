from pathlib import Path
out=[]
for path in ["index.html","earthline-launch-16872.js"]:
    s=Path(path).read_text(encoding="utf-8")
    for needle in ["16784","rankedCauses","ROOT_CAUSE","root cause","rootCause"]:
        start=0
        while True:
            i=s.find(needle,start)
            if i<0: break
            out.append(f"===== {path} :: {needle} @ {i} =====\n"+s[max(0,i-10000):i+22000])
            start=i+1
Path("root-cause-owner-17437.txt").write_text("\n\n".join(out),encoding="utf-8")
print("sections",len(out))
