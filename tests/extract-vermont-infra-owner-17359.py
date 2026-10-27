from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
needle="__earthlineVtInfra16458"
hits=[];start=0
while True:
    i=s.find(needle,start)
    if i<0: break
    hits.append((i,s[max(0,i-12000):i+22000]))
    start=i+1
out=[]
for i,b in hits:
    out.append(f"===== HIT {i} =====\n{b}")
Path("vermont-infra-owner-17359.txt").write_text("\n\n".join(out),encoding="utf-8")
print("hits",len(hits))
