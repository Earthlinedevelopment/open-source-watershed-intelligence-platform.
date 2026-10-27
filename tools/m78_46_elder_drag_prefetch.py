from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE M78.46 — accepted drag target primes reusable Elder evidence"
if marker in s:
    raise SystemExit(0)

old='''m.on('dragend',()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,c=m.getCenter?.();if(!t||!c||!Number.isFinite(Number(c.lng))||!Number.isFinite(Number(c.lat)))return;if(t.code||t.source==='country-center')setPropertyTarget16201({lng:Number(c.lng),lat:Number(c.lat),source:'crosshair-user-drag-16414'},{openPanel:false});else setPropertyTarget16201({lng:Number(c.lng),lat:Number(c.lat),source:'crosshair'},{openPanel:false})});'''
new='''m.on('dragend',()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,c=m.getCenter?.();if(!t||!c||!Number.isFinite(Number(c.lng))||!Number.isFinite(Number(c.lat)))return;if(t.code||t.source==='country-center')setPropertyTarget16201({lng:Number(c.lng),lat:Number(c.lat),source:'crosshair-user-drag-16414'},{openPanel:false});else setPropertyTarget16201({lng:Number(c.lng),lat:Number(c.lat),source:'crosshair'},{openPanel:false});/* EARTHLINE M78.46 — accepted drag target primes reusable Elder evidence. Reuse the existing dragend owner and exact dynamic promise/cache; no new camera/render owner and Elder remains display-only. */try{void window.EARTHLINE_ELDER_TREES_V1_17097?.primePropertyEvidence?.()}catch(_){}});'''

if s.count(old)!=1:
    raise SystemExit(f"M78.46 dragend anchor count={s.count(old)}")
s=s.replace(old,new,1)

if marker not in s:
    raise SystemExit("M78.46 marker missing after patch")
p.write_text(s,encoding="utf-8")
print("Applied M78.46 reusable Elder prefetch on accepted drag target")
