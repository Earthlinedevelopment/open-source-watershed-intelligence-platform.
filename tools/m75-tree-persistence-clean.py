from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")
repls=[
('''        "earthline-property-swale-ditch-16166","earthline-property-swale-canopy-16166",
        "earthline-property-swale-survey-16166"]},''','''        "earthline-property-swale-ditch-16166","earthline-property-swale-canopy-16166",
        "earthline-property-swale-survey-16166","earthline-swale-planting-shadow-15806",
        "earthline-swale-planting-layer-15806"]},'''),
('''  let plantingVisible=true;

  const emptyFC=()=>({type:"FeatureCollection",features:[]});''','''  let plantingVisible=true;
  let lastPlantingData15806=null;

  const emptyFC=()=>({type:"FeatureCollection",features:[]});'''),
('''    const data=plantingPoints15806(fc&&fc.type==="FeatureCollection"?fc:emptyFC());
    const src=earthlineMap.getSource(PLANT_SOURCE);''','''    const data=plantingPoints15806(fc&&fc.type==="FeatureCollection"?fc:emptyFC());
    lastPlantingData15806=data;
    const src=earthlineMap.getSource(PLANT_SOURCE);'''),
('''    earthlineMap.on("style.load",()=>{ensurePlanting15806();updateContoursButton15806()});''','''    earthlineMap.on("style.load",()=>{
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
    });''')
]
for i,(a,b) in enumerate(repls,1):
    if s.count(a)!=1: raise SystemExit(f"tree patch {i} count={s.count(a)}")
    s=s.replace(a,b,1)
p.write_text(s)
print("EARTHLINE_TREE_PERSISTENCE_CLEAN_OK")
