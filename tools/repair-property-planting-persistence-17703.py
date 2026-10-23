from pathlib import Path

p=Path("index.html")
s=p.read_text(errors="strict")

old_registry='''        "earthline-property-swale-ditch-16166","earthline-property-swale-canopy-16166",
        "earthline-property-swale-survey-16166"]},'''
new_registry='''        "earthline-property-swale-ditch-16166","earthline-property-swale-canopy-16166",
        "earthline-property-swale-survey-16166","earthline-swale-planting-shadow-15806",
        "earthline-swale-planting-layer-15806"]},'''
if s.count(old_registry)!=1:
    raise SystemExit(f"REGISTRY_TARGET={s.count(old_registry)}")
s=s.replace(old_registry,new_registry,1)

old_state='''  let plantingVisible=true;

  const emptyFC=()=>({type:"FeatureCollection",features:[]});'''
new_state='''  let plantingVisible=true;
  let lastPlantingData15806=null;

  const emptyFC=()=>({type:"FeatureCollection",features:[]});'''
if s.count(old_state)!=1:
    raise SystemExit(f"STATE_TARGET={s.count(old_state)}")
s=s.replace(old_state,new_state,1)

old_sync='''    const data=plantingPoints15806(fc&&fc.type==="FeatureCollection"?fc:emptyFC());
    const src=earthlineMap.getSource(PLANT_SOURCE);'''
new_sync='''    const data=plantingPoints15806(fc&&fc.type==="FeatureCollection"?fc:emptyFC());
    lastPlantingData15806=data;
    const src=earthlineMap.getSource(PLANT_SOURCE);'''
if s.count(old_sync)!=1:
    raise SystemExit(f"SYNC_TARGET={s.count(old_sync)}")
s=s.replace(old_sync,new_sync,1)

old_style='''    earthlineMap.on("style.load",()=>{ensurePlanting15806();updateContoursButton15806()});'''
new_style='''    earthlineMap.on("style.load",()=>{
      ensurePlanting15806();
      try{
        if(lastPlantingData15806&&Array.isArray(lastPlantingData15806.features)&&lastPlantingData15806.features.length){
          const src=earthlineMap.getSource(PLANT_SOURCE);
          if(src&&src.setData)src.setData(lastPlantingData15806);
          const propertyOwnsPlanting=state.mode==="property"&&!state.active&&!!(M&&M.analysisReady&&M.layers&&M.layers.swales&&M.layers.swales.on);
          setPlantingVisible15806(propertyOwnsPlanting);
        }
      }catch(e){}
      updateContoursButton15806()
    });'''
if s.count(old_style)!=1:
    raise SystemExit(f"STYLE_TARGET={s.count(old_style)}")
s=s.replace(old_style,new_style,1)

p.write_text(s)
print("EARTHLINE_PROPERTY_PLANTING_PERSISTENCE_17703_PATCH_OK")
