from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
hits=[]
pos=0
while True:
    i=s.find("loadDEM(",pos)
    if i<0: break
    hits.append((i,s[max(0,i-1800):i+3600]))
    pos=i+1
out=[]
for n,(i,chunk) in enumerate(hits):
    out.append(f"===== LOADDEM {n} @ {i} =====\n{chunk}")
Path("loadDEM-callers-17339.txt").write_text("\n\n".join(out),encoding="utf-8")
print("hits",len(hits))
