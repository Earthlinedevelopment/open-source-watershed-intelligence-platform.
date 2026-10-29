from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="const slope=hy.slope[i],acc=hy.acc[i],minSlope=relaxed?.05:.20,maxSlope=relaxed?(focusMode?18:4):13.5;"
new="const slope=hy.slope[i],acc=hy.acc[i],minSlope=0,maxSlope=4;"
n=s.count(old)
if n!=1:
    raise SystemExit(f"expected one Regional slope owner, found {n}")
p.write_text(s.replace(old,new),encoding="utf-8")
