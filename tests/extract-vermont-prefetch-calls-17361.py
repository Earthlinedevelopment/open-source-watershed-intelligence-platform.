from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
needle="earthlinePrefetchVermontAuthority16263("
hits=[];start=0
while True:
    i=s.find(needle,start)
    if i<0: break
    hits.append((i,s[max(0,i-9000):i+15000]))
    start=i+1
Path("vermont-prefetch-calls-17361.txt").write_text("\n\n".join(f"===== HIT {i} =====\n{b}" for i,b in hits),encoding="utf-8")
print("hits",len(hits))
