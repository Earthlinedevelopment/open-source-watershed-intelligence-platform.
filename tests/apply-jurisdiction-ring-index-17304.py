from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="const scale16722=4,bins16722=new Map();"
new="const scale16722=64,bins16722=new Map();"
n=s.count(old)
if n!=1: raise SystemExit(f"ring-index scale anchor count {n}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_JURISDICTION_RING_INDEX_17304: finer latitude edge bins only; exact edge tests and containment semantics unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("tightened exact jurisdiction ring index from 4 to 64 bins/degree 17304")
