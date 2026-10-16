from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
needle="earthline-telemetry"
out=[]
start=0
while True:
    i=s.find(needle,start)
    if i<0: break
    out.append(s[max(0,i-3500):i+5000])
    start=i+1
Path("telemetry-snippet-17327.txt").write_text("\n\n===== HIT =====\n\n".join(out),encoding="utf-8")
print("telemetry hits",len(out))
