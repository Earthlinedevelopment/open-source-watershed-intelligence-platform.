from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
hits=[]
for token in ["const TERRARIUM","TERRARIUM=","TERRARIUM_ALT"]:
    pos=0
    while True:
        i=s.find(token,pos)
        if i<0: break
        hits.append((i,s[max(0,i-800):i+1800]))
        pos=i+1
Path("terrarium-endpoints-17343.txt").write_text("\n\n".join(f"@{i}\n{c}" for i,c in hits),encoding="utf-8")
print("hits",len(hits))
