from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
out=[]
anchors=[
  "candidates.sort((a,b)=>b.score-a.score);",
  "const chosen=[],primarySpacing",
  "authoritativeSafeSwales15815",
  "propertyResultLock15815",
  "safeSwales",
  "exclusion-verified bioswale"
]
for needle in anchors:
    start=0;hits=0
    while True:
        i=s.find(needle,start)
        if i<0 or hits>=20: break
        out.append(f"===== {needle} @ {i} =====\n"+s[max(0,i-9000):i+28000])
        start=i+1;hits+=1
Path("property-selector-postclip-17447.txt").write_text("\n\n".join(out),encoding="utf-8")
print("sections",len(out))
