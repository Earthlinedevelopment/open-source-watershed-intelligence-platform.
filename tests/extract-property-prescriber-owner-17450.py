from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
out=[]
for needle in ["function prescribeSwales","async function prescribeSwales","runProperty15778","spacingStats(","targetSwaleSpacingM","swCount=64"]:
    start=0;hits=0
    while True:
        i=s.find(needle,start)
        if i<0 or hits>=30: break
        out.append(f"===== {needle} @ {i} =====\n"+s[max(0,i-12000):i+36000])
        start=i+1;hits+=1
Path("property-prescriber-owner-17450.txt").write_text("\n\n".join(out),encoding="utf-8")
print("sections",len(out))
