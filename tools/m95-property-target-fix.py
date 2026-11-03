from pathlib import Path
import hashlib
p=Path("index.html")
s=p.read_text(encoding="utf-8")
sha=hashlib.sha256(s.encode()).hexdigest()
assert sha=="3dfc07371beed3ca2f7f479ca62dcd0cad6e91dcf16ce204cdfa3f709d5f9739", f"Unexpected source {sha}; refuse patch"
old='''    if(running)return false;
    /* EARTHLINE 16531 — Property transition uses the existing corridor-tip button so its private dismissal owner records acknowledgment and cannot reopen over Property. */'''
new='''    if(running)return false;
    /* M95: freeze the user's actual crosshair BEFORE closing a corridor tip or an
       information surface. Those dismissal callbacks can move the camera/target;
       Property science and Elder coverage must use the clicked location. */
    const mp=map(),m=model(),selectedAtClickM95=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const chosen=selectedAtClickM95?Object.assign({},selectedAtClickM95):null;
    const c=(chosen&&Number.isFinite(Number(chosen.lng))&&Number.isFinite(Number(chosen.lat)))?{lng:Number(chosen.lng),lat:Number(chosen.lat)}:mp?.getCenter?.();
    /* EARTHLINE 16531 — Property transition uses the existing corridor-tip button so its private dismissal owner records acknowledgment and cannot reopen over Property. */'''
assert s.count(old)==1, "preflight declaration not unique"
s=s.replace(old,new,1)
old='''    try{window.earthlineClosePropertyInfoSurfaces16372?.("property-start");}catch(_){}
    const mp=map(),m=model(),chosen=window.EARTHLINE_PROPERTY_TARGET_16201,c=(chosen&&Number.isFinite(Number(chosen.lng))&&Number.isFinite(Number(chosen.lat)))?{lng:Number(chosen.lng),lat:Number(chosen.lat)}:mp?.getCenter?.();'''
new='''    try{window.earthlineClosePropertyInfoSurfaces16372?.("property-start");}catch(_){}
    /* Restore the frozen click target after those preflight UI dismissals. */
    if(chosen)window.EARTHLINE_PROPERTY_TARGET_16201=Object.assign({},chosen);'''
assert s.count(old)==1, "property target capture not unique"
s=s.replace(old,new,1)
old='''    }else if(sourceTier==="open-data"&&acquisitionResult==="features-found"){
      kind="open-data";label="OPEN-DATA SCREENING · FIELD VERIFICATION REQUIRED";
      detail="Available open-data / loaded map-source road and building evidence was applied. Coverage is not authoritative and may be incomplete; field verification is required before any siting decision.";
    }else if(acquisitionResult==="unavailable"){'''
new='''    }else if(sourceTier==="open-data"&&acquisitionResult==="features-found"){
      kind="open-data";label="OPEN-DATA SCREENING · FIELD VERIFICATION REQUIRED";
      detail="Available open-data / loaded map-source road and building evidence was applied. Coverage is not authoritative and may be incomplete; field verification is required before any siting decision.";
    }else if(sourceTier==="open-data"&&acquisitionResult==="screened-clear"&&c.publicationAllowed===true){
      kind="open-data";label="OPEN-DATA SCREENING · NO MAPPED EXCLUSIONS RETURNED · FIELD VERIFICATION REQUIRED";
      detail="An open-data exclusion query completed with no mapped roads or structures returned for this area. This is not authoritative clearance; on-site verification is required before siting.";
    }else if(acquisitionResult==="unavailable"){'''
assert s.count(old)==1, "screened-clear evidence branch not unique"
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
newsha=hashlib.sha256(s.encode()).hexdigest()
assert newsha=="b120ba551c5aff15a3b3de2bb4dea0969167ead1a8a0a11ac9127720595d1840", f"Unexpected patch output: {newsha}"
print("M95 exact-source patch OK",newsha)
