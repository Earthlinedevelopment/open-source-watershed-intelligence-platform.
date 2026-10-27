from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE M78.46 — accepted drag target primes reusable Elder evidence"
if marker in s:
    raise SystemExit(0)

old='''  map.on("dragend",()=>{setPropertyTarget16201(map.getCenter(),{source:"crosshair"});try{window.earthlineApplyCrosshairFrame15836?.("dragend")}catch(_){} });'''
new='''  map.on("dragend",()=>{
    setPropertyTarget16201(map.getCenter(),{source:"crosshair"});
    try{window.earthlineApplyCrosshairFrame15836?.("dragend")}catch(_){}
    /* EARTHLINE M78.46 — accepted drag target primes reusable Elder evidence.
       Reuse the existing dragend owner and existing dynamic Elder promise/cache;
       add no new camera/render listener and do not gate hydrology on Elder work. */
    try{void window.EARTHLINE_ELDER_TREES_V1_17097?.primePropertyEvidence?.()}catch(_){}
  });'''

if s.count(old)!=1:
    raise SystemExit(f"M78.46 dragend anchor count={s.count(old)}")
s=s.replace(old,new,1)

if marker not in s:
    raise SystemExit("M78.46 marker missing after patch")
p.write_text(s,encoding="utf-8")
print("Applied M78.46 reusable Elder prefetch on accepted drag target")
