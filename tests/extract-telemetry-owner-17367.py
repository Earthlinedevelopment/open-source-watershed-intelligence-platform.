from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
needles=["earthline-telemetry","supabase.co/functions/v1/earthline-telemetry"]
out=[]
for needle in needles:
    start=0
    while True:
        i=s.find(needle,start)
        if i<0: break
        out.append(f"===== {needle} @ {i} =====\n"+s[max(0,i-5000):i+9000])
        start=i+1
Path("telemetry-owner-17367.txt").write_text("\n\n".join(out),encoding="utf-8")
print("hits",len(out))
