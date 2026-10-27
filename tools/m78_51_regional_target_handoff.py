from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE M78.51 — published Regional center explicitly owns the default Property target"
if marker in s:
    raise SystemExit(0)

anchor="""    try{
      if(typeof window.earthlineReconcilePanel16188==='function')
        window.earthlineReconcilePanel16188();"""

pos=s.rfind(anchor)
if pos < 0:
    raise SystemExit("M78.51 Regional publication anchor missing")

context=s[max(0,pos-9000):min(len(s),pos+5000)]
if "countryRequest16845" not in context or "EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970" not in context:
    raise SystemExit("M78.51 anchor is not inside active Regional publication owner")

insert="""    /* EARTHLINE M78.51 — published Regional center explicitly owns the default Property target.
       Country runs already set country-center explicitly. State/region/city Regional runs must
       do the same at core publication; otherwise the startup crosshair default can survive even
       after the map resolves elsewhere. Corridor and user-drag targets remain separate owners. */
    try{
      if(!countryRequest16845){
        const m7851=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
        const c7851=m7851&&typeof m7851.getCenter==='function'?m7851.getCenter():null;
        const setTargetM7851=typeof window.earthlineSetPropertyTarget16201==='function'
          ?window.earthlineSetPropertyTarget16201
          :(typeof setPropertyTarget16201==='function'?setPropertyTarget16201:null);
        if(c7851&&setTargetM7851&&Number.isFinite(Number(c7851.lng))&&Number.isFinite(Number(c7851.lat))){
          setTargetM7851({lng:Number(c7851.lng),lat:Number(c7851.lat),source:'regional-center'},{openPanel:false});
        }
      }
    }catch(_){}
"""

s=s[:pos]+insert+s[pos:]

if marker not in s:
    raise SystemExit("M78.51 marker missing after repair")

p.write_text(s,encoding="utf-8")
print("Applied M78.51 Regional center -> Property target handoff")
