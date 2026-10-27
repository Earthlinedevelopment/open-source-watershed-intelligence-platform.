from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
a="function earthlinePointInJurisdiction16539"
i=s.find(a)
if i<0: raise SystemExit("jurisdiction point owner missing")
Path("jurisdiction-point-owner-17356.txt").write_text(s[max(0,i-7000):i+14000],encoding="utf-8")
print("extracted jurisdiction point owner",i)
