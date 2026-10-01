from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""m.on('dragend',()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201;if(t&&(t.code||t.source==='country-center')){const c=m.getCenter?.();if(c&&Number.isFinite(Number(c.lng))&&Number.isFinite(Number(c.lat)))setPropertyTarget16201({lng:Number(c.lng),lat:Number(c.lat),source:'crosshair-user-drag-16414'},{openPanel:false})}});m.on('moveend',()=>{syncPropertyTargetFromMap16201();positionSuggestions16233()});"""
new="""m.on('dragend',()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,c=m.getCenter?.();if(!t||!c||!Number.isFinite(Number(c.lng))||!Number.isFinite(Number(c.lat)))return;if(t.code||t.source==='country-center')setPropertyTarget16201({lng:Number(c.lng),lat:Number(c.lat),source:'crosshair-user-drag-16414'},{openPanel:false});else setPropertyTarget16201({lng:Number(c.lng),lat:Number(c.lat),source:'crosshair'},{openPanel:false})});m.on('moveend',()=>{syncPropertyTargetFromMap16201();positionSuggestions16233()});"""
if new not in s:
    if old not in s: raise SystemExit("property drag target handler anchor missing")
    s=s.replace(old,new,1)
if new not in s: raise SystemExit("Alaska drag target handoff patch missing")
p.write_text(s,encoding="utf-8")
print("patched existing dragend owner to refresh ordinary crosshair target")

# trigger Alaska target handoff repair
