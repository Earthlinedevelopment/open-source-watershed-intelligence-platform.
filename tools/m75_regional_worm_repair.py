from pathlib import Path
import sys

p=Path(sys.argv[1] if len(sys.argv)>1 else "index.html")
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

old_planting="""    const data=plantingPoints15806(fc&&fc.type==="FeatureCollection"?fc:emptyFC());
    const src=earthlineMap.getSource(PLANT_SOURCE);
    if(src&&src.setData)src.setData(data);
    setPlantingVisible15806(plantingVisible&&data.features.length>0);
    M.naturalSwalePlanting15806={features:data.features.length,visible:plantingVisible,source:PLANT_SOURCE};
    return true"""
new_planting="""    const data=plantingPoints15806(fc&&fc.type==="FeatureCollection"?fc:emptyFC());
    const src=earthlineMap.getSource(PLANT_SOURCE);
    if(src&&src.setData)src.setData(data);
    /* EARTHLINE 17701 — planting visibility is current Property truth, not a
       sticky prior visibility latch. A transition may hide planting temporarily,
       but a committed settled Property with planting features must restore it. */
    const propertyReady17701=!!(M&&M.analysisReady&&state.mode==="property"&&!state.active);
    const plantingOn17701=propertyReady17701&&data.features.length>0;
    setPlantingVisible15806(plantingOn17701);
    M.naturalSwalePlanting15806={features:data.features.length,visible:plantingOn17701,source:PLANT_SOURCE};
    return true"""

for label,old,new in [
    ("regional visibility owner",old_visibility,new_visibility),
    ("legacy worm width overrides",old_css,new_css),
    ("planting visibility latch",old_planting,new_planting)
]:
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{label}: count={n}, expected=1")
    s=s.replace(old,new,1)

p.write_text(s)
print("EARTHLINE_M75_REGIONAL_AND_PLANTING_REPAIR_OK")
