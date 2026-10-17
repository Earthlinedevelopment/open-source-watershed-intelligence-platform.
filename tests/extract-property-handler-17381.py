from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
needles=["earthlineDeclareProperty16169","EARTHLINE_PROPERTY_RUN_AUDIT_16173","earthlineSetPropertyTarget16201","20-acre"]
out=[]
for n in needles:
    start=0
    while True:
        i=s.find(n,start)
        if i<0: break
        out.append(f"===== {n} @ {i} =====\n"+s[max(0,i-7000):i+15000])
        start=i+1
Path("property-handler-17381.txt").write_text("\n\n".join(out),encoding="utf-8")
print("extracted",len(out))
