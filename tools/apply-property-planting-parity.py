from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")

pairs=[
(
'''        "earthline-property-swale-survey-16166"]},''',
'''        "earthline-property-swale-survey-16166","earthline-swale-planting-shadow-15806",
        "earthline-swale-planting-layer-15806"]},'''
),
(
'''  let plantingVisible=true;''',
'''  let plantingVisible=true;
  let lastPlantingData15806=null;'''
),
(
'''    const data=plantingPoints15806(fc&&fc.type==="FeatureCollection"?fc:emptyFC());
    const src=earthlineMap.getSource(PLANT_SOURCE);''',
'''    const data=plantingPoints15806(fc&&fc.type==="FeatureCollection"?fc:emptyFC());
    lastPlantingData15806=data;
    const src=earthlineMap.getSource(PLANT_SOURCE);'''
),
(
'''    earthlineMap.on("style.load",()=>{ensurePlanting15806();updateContoursButton15806()});''',
'''    earthlineMap.on("style.load",()=>{
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
)
]

for i,(old,new) in enumerate(pairs,1):
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"PLANT_PATCH_{i}_COUNT={n}")
    s=s.replace(old,new,1)

p.write_text(s)
print("EARTHLINE_PROPERTY_PLANTING_PARITY_OK")
