from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
for a in ["scale refinement coast-1","scale refinement coast-2","coast-1","coast-2"]:
    i=s.find(a)
    print(a,i)
    if i>=0:
        Path("coast-refinement-owner-17338.txt").write_text(s[max(0,i-12000):i+22000],encoding="utf-8")
        break
