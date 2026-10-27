from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
anchors=["groupRows16839=[]","groupRows16839.push","EARTHLINE_STATEWIDE_SUPERTILE_16839"]
out=[]
for a in anchors:
    i=s.find(a)
    out.append(f"===== {a} @ {i} =====\n")
    if i>=0: out.append(s[max(0,i-12000):i+26000])
Path("supertile-owner-17355.txt").write_text("\n".join(out),encoding="utf-8")
print("extracted supertile owner")
