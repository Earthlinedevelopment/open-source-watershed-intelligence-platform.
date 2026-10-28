from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="  if(!pts||pts.length<3||lenM<12)return false;"
new="  if(!pts||pts.length<3||lenM<earthlineMinimumSwaleLengthM15768())return false;"
count=s.count(old)
if count!=1:
    raise SystemExit(f"geometry minimum-length owner count={count}")
p.write_text(s.replace(old,new),encoding="utf-8")
