from pathlib import Path
import hashlib
p=Path("index.html")
s=p.read_text(encoding="utf-8")
original=hashlib.sha256(s.encode()).hexdigest()
assert original=="b09026d14338bdbf7a385c07ace7e14b554ed4057dca3aac6bdbd731c23f68f1",f"Unexpected M94 donor: {original}"
edits=[
('''    if(running)return false;
    /* EARTHLINE 16531 — Property transition uses the existing corridor-tip button so its private dismissal owner records acknowledgment and cannot reopen over Property. */''',
'''    if(running)return false;
    /* M95: freeze selected map/crosshair target before unrelated UI dismissals. */
    const mp=map(),m=model(),selectedAtClickM95=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const chosen=selectedAtClickM95?Object.assign({},selectedAtClickM95):null;
    const c=(chosen&&Number.isFinite(Number(chosen.lng))&&Number.isFinite(Number(chosen.lat)))?{lng:Number(chosen.lng),lat:Number(chosen.lat)}:mp?.getCenter?.();
    /* EARTHLINE 16531 — Property transition uses the existing corridor-tip button so its private dismissal owner records acknowledgment and cannot reopen over Property. */'''),
('''    try{window.earthlineClosePropertyInfoSurfaces16372?.("property-start");}catch(_){}
    const mp=map(),m=model(),chosen=window.EARTHLINE_PROPERTY_TARGET_16201,c=(chosen&&Number.isFinite(Number(chosen.lng))&&Number.isFinite(Number(chosen.lat)))?{lng:Number(chosen.lng),lat:Number(chosen.lat)}:mp?.getCenter?.();''',
'''    try{window.earthlineClosePropertyInfoSurfaces16372?.("property-start");}catch(_){}
    if(chosen)window.EARTHLINE_PROPERTY_TARGET_16201=Object.assign({},chosen);'''),
('''    }else if(sourceTier==="open-data"&&acquisitionResult==="features-found"){
      kind="open-data";label="OPEN-DATA SCREENING · FIELD VERIFICATION REQUIRED";
      detail="Available open-data / loaded map-source road and building evidence was applied. Coverage is not authoritative and may be incomplete; field verification is required before any siting decision.";
    }else if(acquisitionResult==="unavailable"){''',
'''    }else if(sourceTier==="open-data"&&acquisitionResult==="features-found"){
      kind="open-data";label="OPEN-DATA SCREENING · FIELD VERIFICATION REQUIRED";
      detail="Available open-data / loaded map-source road and building evidence was applied. Coverage is not authoritative and may be incomplete; field verification is required before any siting decision.";
    }else if(sourceTier==="open-data"&&acquisitionResult==="screened-clear"&&c.publicationAllowed===true){
      kind="open-data";label="OPEN-DATA SCREENING · NO MAPPED EXCLUSIONS RETURNED · FIELD VERIFICATION REQUIRED";
      detail="An open-data exclusion query completed with no mapped roads or structures returned for this area. This is not authoritative clearance; on-site verification is required before siting.";
    }else if(acquisitionResult==="unavailable"){'''),
("        if(!propertyOwnsDisplay16726&&!focusMode){const cov16792=cameraCoverage(m,b);if(!Number.isFinite(cov16792)||cov16792<.98){const ok16792=await settleRegionalCamera(m,b,runToken);if(ok16792!==true)throw new Error('regional final display camera reconciliation failed');}}",
'''        /* M95: optional post-publication watershed/aquifer context MUST NOT
           reclaim the camera after a user has moved the Property crosshair.
           Initial Regional framing remains owned by the published core. */''')
]
for old,new in edits:
 assert s.count(old)==1,f"Refuse unexpected code: {old[:95]} found {s.count(old)}"
 s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("M95_INTEGRATED_SOURCE_SHA",hashlib.sha256(s.encode()).hexdigest())
