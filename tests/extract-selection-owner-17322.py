from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
anchors=["candidates.sort((a,b)=>b.score-a.score);","const chosen=[],primarySpacing"]
out=[]
for a in anchors:
    i=s.find(a)
    out.append(f"===== {a} @ {i} =====\n")
    if i>=0: out.append(s[max(0,i-4500):i+9000])
Path("selection-owner-17322.txt").write_text("\n".join(out),encoding="utf-8")
print("selection owner extracted")
