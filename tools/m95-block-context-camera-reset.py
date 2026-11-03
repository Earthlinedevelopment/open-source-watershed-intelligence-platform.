from pathlib import Path
import hashlib
p=Path("index.html")
s=p.read_text(encoding="utf-8")
digest=hashlib.sha256(s.encode()).hexdigest()
assert digest=="b120ba551c5aff15a3b3de2bb4dea0969167ead1a8a0a11ac9127720595d1840", f"unexpected candidate source: {digest}"
old="        if(!propertyOwnsDisplay16726&&!focusMode){const cov16792=cameraCoverage(m,b);if(!Number.isFinite(cov16792)||cov16792<.98){const ok16792=await settleRegionalCamera(m,b,runToken);if(ok16792!==true)throw new Error('regional final display camera reconciliation failed');}}"
new="""        /* M95: optional context enrichment is not a camera owner. The Regional
           core already established its frame; users may have since panned to a
           Property crosshair. Never snap the map back after core publication. */
        /* No post-publication fitBounds here. */"""
assert s.count(old)==1, f"unsafe replacement count {s.count(old)}"
s=s.replace(old,new,1)
newdigest=hashlib.sha256(s.encode()).hexdigest()
assert newdigest=="1611170162fa13dfe9f758830c10e6d6e33a006ef8eb285fe6fa1fe850357ebb",newdigest
p.write_text(s,encoding="utf-8")
print("M95_CONTEXT_CAMERA_FROZEN",newdigest)
