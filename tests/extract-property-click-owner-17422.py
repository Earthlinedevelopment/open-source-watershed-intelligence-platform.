from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
needles=["async function declareProperty","function ensureDeclareButton","earthlinePropertyClickOwner16546","property.onclick","earthlineDeclarePropertyAtCrosshair16173"]
out=[]
for n in needles:
    start=0
    while True:
        i=s.find(n,start)
        if i<0: break
        out.append(f"===== {n} @ {i} =====\n"+s[max(0,i-5000):i+14000])
        start=i+1
Path("property-click-owner-17422.txt").write_text("\n\n".join(out),encoding="utf-8")
print("hits",len(out))
