from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    if(style16584&&Array.isArray(style16584.layers)){
      const surfaceLayers16584=style16584.layers.filter(surfaceLayer16584),layerIds16584=surfaceLayers16584.map(l16584=>l16584.id).filter(Boolean);"""
new="""    const worldCopies16584=(()=>{try{return !!(mp16584.getRenderWorldCopies&&mp16584.getRenderWorldCopies())}catch(_){return false}})();
    /* EARTHLINE 16911 — WRAPPED-WORLD WATER CLIP SAFETY.
       When world copies are enabled (needed for New Zealand dateline navigation),
       rendered/source vector water geometry may be duplicated/wrapped across the seam.
       Do not let that presentation geometry override the deterministic Regional land-validity
       grid and Natural Earth water parts. The same final flow-safety checks remain active. */
    if(style16584&&Array.isArray(style16584.layers)&&!worldCopies16584){
      const surfaceLayers16584=style16584.layers.filter(surfaceLayer16584),layerIds16584=surfaceLayers16584.map(l16584=>l16584.id).filter(Boolean);"""
if old not in s: raise SystemExit("final water clip style anchor missing")
s=s.replace(old,new,1)
audit="""      failClosedNoEvidence:!evidenceReady16584,at:new Date().toISOString()"""
audit_new="""      failClosedNoEvidence:!evidenceReady16584,worldCopiesSkippedStyleWater:worldCopies16584,at:new Date().toISOString()"""
if audit not in s: raise SystemExit("water audit anchor missing")
s=s.replace(audit,audit_new,1)
p.write_text(s,encoding="utf-8")
print("patched wrapped-world final water clip")

# trigger apply
