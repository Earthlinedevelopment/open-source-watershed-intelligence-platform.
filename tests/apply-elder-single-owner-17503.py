from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){} /* EARTHLINE_PROPERTY_ELDER_EARLY_START_17166 */"
new="/* EARTHLINE 17503 — retired duplicate early Elder start; terminalPropertyRun is sole lifecycle owner. */"
if s.count(old)!=1: raise SystemExit(f"duplicate Elder owner anchor {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_ELDER_SINGLE_LIFECYCLE_OWNER_17503: retired legacy early start; terminalPropertyRun solely starts/publishes Elder. -->\n"+s
p.write_text(s,encoding="utf-8")
print("removed duplicate early Elder start 17503")
