from pathlib import Path
import os
scale=int(os.environ.get("RING_SCALE","256"))
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="const scale16722=4,bins16722=new Map();"
new=f"const scale16722={scale},bins16722=new Map();"
if s.count(old)!=1:
    raise SystemExit(f"ring-index anchor count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print(f"EARTHLINE_RING_SCALE_17255={scale}")
