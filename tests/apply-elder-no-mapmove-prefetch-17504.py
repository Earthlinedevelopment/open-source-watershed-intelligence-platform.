from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="const prefetch17174=ok=>{if(ok){try{void window.EARTHLINE_ELDER_TREES_V1_17097?.prefetchPropertyTarget?.()}catch(_){}}return ok};"
new="const prefetch17174=ok=>ok; /* EARTHLINE 17504 — retire map-move Elder warmBbox flood; exact Property frame prime owns compute warm. */"
if s.count(old)!=1: raise SystemExit(f"map-move prefetch anchor {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_ELDER_NO_MAPMOVE_PREFETCH_17504: target reconciliation no longer queues stale warmBbox work. -->\n"+s
p.write_text(s,encoding="utf-8")
print("removed map-move Elder prefetch flood 17504")
