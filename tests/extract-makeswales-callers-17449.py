from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
needle="makeSwales("
out=[];start=0;n=0
while True:
    i=s.find(needle,start)
    if i<0: break
    n+=1
    out.append(f"===== HIT {n} @ {i} =====\n"+s[max(0,i-8000):i+16000])
    start=i+1
Path("makeswales-callers-17449.txt").write_text("\n\n".join(out),encoding="utf-8")
print("hits",n)
