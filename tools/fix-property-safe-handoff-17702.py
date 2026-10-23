from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")
old="const safeOpacity17172=0;"
new="const safeOpacity17172=naturalRendered17172>0?0:.98;"
n=s.count(old)
if n!=1: raise SystemExit(f"safe opacity target count {n}, expected 1")
s=s.replace(old,new,1)
p.write_text(s)
print("EARTHLINE_PROPERTY_SAFE_HANDOFF_17702_OK")
