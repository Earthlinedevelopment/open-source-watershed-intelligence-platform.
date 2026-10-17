from pathlib import Path
out=[]
for path in ["index.html","earthline-launch-16872.js"]:
    s=Path(path).read_text(encoding="utf-8")
    for needle in [
        "earthlineRegionalVectorOverlay16020",
        "earthline-swale-hit-16070",
        "corridor",
        "Zoom to location",
        "zoom to location",
        "A1",
        "data-layer"
    ]:
        start=0
        hits=0
        while True:
            i=s.find(needle,start)
            if i<0 or hits>=30: break
            out.append(f"===== {path} :: {needle} @ {i} =====\n"+s[max(0,i-5500):i+10500])
            start=i+1;hits+=1
Path("regional-corridor-owner-17424.txt").write_text("\n\n".join(out),encoding="utf-8")
print("sections",len(out))
