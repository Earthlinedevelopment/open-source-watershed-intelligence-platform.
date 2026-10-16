from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
a="const candidatesBeforeJurisdiction16539=candidates.length;"
i=s.find(a)
if i<0: raise SystemExit("anchor missing")
Path("selection-tail-17323.txt").write_text(s[i:i+42000],encoding="utf-8")
print("selection tail extracted",i)
