from pathlib import Path

p=Path("index.html")
s=p.read_text(errors="strict")

old_visibility="""function corridorGeometryVisible17434(map){
    const tier=activeTier16168();
    if(tier==='focus'||tier==='regional')return true;
    if(tier==='property')return false;
    return false;
  }"""
new_visibility="""function corridorGeometryVisible17434(map){
    const tier=activeTier16168();
    if(tier==='focus')return true;
    if(tier==='regional'){
      const zoom=Number(map&&map.getZoom&&map.getZoom());
      return Number.isFinite(zoom)&&zoom>=9;
    }
    return false;
  }"""

old_css="""#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="rgba(8,18,13,.96)"]{stroke-width:20px!important;opacity:1!important}
#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="#42ff83"]{stroke-width:13.5px!important;opacity:1!important}
#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="#ffc12f"]{stroke-width:11.5px!important;opacity:1!important}
#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path[stroke="#ff8a2d"]{stroke-width:9.5px!important;opacity:1!important}"""
new_css="""/* EARTHLINE 17700 — Regional corridor width belongs to the active renderer.
   Do not override its zoom-scaled widths with legacy fixed-pixel worm styling. */"""

for label,old,new in [
    ("regional visibility owner",old_visibility,new_visibility),
    ("legacy worm width overrides",old_css,new_css)
]:
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{label}: count={n}, expected=1")
    s=s.replace(old,new,1)

p.write_text(s)
print("EARTHLINE_M75_REGIONAL_WORM_REPAIR_OK")
