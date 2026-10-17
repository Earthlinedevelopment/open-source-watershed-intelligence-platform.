from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
hits=[]
start=0
needle="scale refinement"
while True:
    i=s.find(needle,start)
    if i<0: break
    hits.append(s[max(0,i-4500):i+9000])
    start=i+1
Path("scale-refinement-owner-17338.txt").write_text("\n\n===== HIT =====\n".join(hits),encoding="utf-8")
print("hits",len(hits))
