from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
changes=[
('const loopish=gapM<Math.max(8,lenM*0.12);','const loopish=gapM<Math.max(2.5,lenM*0.12);'),
('if(tortuosityM76>1.35)return false;','if(tortuosityM76>1.65)return false;')
]
for old,new in changes:
    if s.count(old)!=1:
        raise SystemExit(f"expected one occurrence of {old!r}; found {s.count(old)}")
    s=s.replace(old,new)
p.write_text(s,encoding="utf-8")
