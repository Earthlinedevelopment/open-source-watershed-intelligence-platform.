from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""  async function declareProperty(e){
    e?.preventDefault?.();e?.stopPropagation?.();e?.stopImmediatePropagation?.();
    const governed=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof governed!=='function'){
      try{if(typeof earthlineReady==='function')earthlineReady('PROPERTY ANALYSIS BLOCKED — governed property controller is unavailable.')}catch(_){}
      return false;
    }
    const target=window.EARTHLINE_PROPERTY_TARGET_16201;
"""
new="""  async function declareProperty(e){
    e?.preventDefault?.();e?.stopPropagation?.();e?.stopImmediatePropagation?.();
    const governed=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof governed!=='function'){
      try{if(typeof earthlineReady==='function')earthlineReady('PROPERTY ANALYSIS BLOCKED — governed property controller is unavailable.')}catch(_){}
      return false;
    }
    /* EARTHLINE 17383 — authoritative one-click Property handoff.
       The green CROSSHAIR · 20 ACRES control means the current map crosshair,
       so bind that center synchronously in this same owner before the terminal run. */
    try{
      const mp17383=map(),c17383=mp17383?.getCenter?.();
      const lng17383=Number(c17383?.lng),lat17383=Number(c17383?.lat);
      if(Number.isFinite(lng17383)&&Number.isFinite(lat17383)){
        window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false;
        window.EARTHLINE_COUNTRY_TARGET_USER_UNLOCKED_17240=true;
        const prev17383=window.EARTHLINE_PROPERTY_TARGET_16201||{};
        const next17383={...prev17383,lng:lng17383,lat:lat17383,source:'crosshair',code:'',at:new Date().toISOString()};
        if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(next17383,{openPanel:false});
        else window.EARTHLINE_PROPERTY_TARGET_16201=next17383;
        window.EARTHLINE_PROPERTY_FIRST_CLICK_17383={lng:lng17383,lat:lat17383,at:next17383.at};
      }
    }catch(_){}
    const target=window.EARTHLINE_PROPERTY_TARGET_16201;
"""
if s.count(old)!=1: raise SystemExit(f"declare anchor {s.count(old)}")
s=s.replace(old,new,1)

# Stamp current generation onto Property presentation features, without changing geometry/science.
oldbase="""const orientation=orientationForCoords16177(coords),base=Object.assign({},f.properties||{},{texture_flip:orientation.textureFlip,swale_width_m:9,"""
newbase="""const orientation=orientationForCoords16177(coords),base=Object.assign({},f.properties||{},{property_search_gen:Number(model()?.searchGen||0),texture_flip:orientation.textureFlip,swale_width_m:9,"""
if s.count(oldbase)!=1: raise SystemExit(f"base anchor {s.count(oldbase)}")
s=s.replace(oldbase,newbase,1)

# Add a reset inside the existing texture owner so its private signature/cache is retired too.
oldsync="""  async function syncTexture(reason='sync'){clearTimeout(syncQueued);const mp=map(),active=propertyActive();"""
newsync="""  function resetPropertyTexture17383(reason='new-property-attempt'){
    const mp=map();lastSignature='';
    try{const src=mp?.getSource?.(SOURCE);if(src?.setData)src.setData(EMPTY)}catch(_){}
    for(const id of Object.values(LAYERS))visible(id,false);
    try{if(typeof window.earthlineSyncNaturalSwalePlanting15806==='function')window.earthlineSyncNaturalSwalePlanting15806(EMPTY)}catch(_){}
    try{if(typeof window.earthlineSetNaturalSwalePlantingVisible15806==='function')window.earthlineSetNaturalSwalePlantingVisible15806(false)}catch(_){}
    window.EARTHLINE_PROPERTY_TEXTURE_RETIRE_17383={reason,searchGen:Number(model()?.searchGen||0),at:new Date().toISOString()};
    return true;
  }
  async function syncTexture(reason='sync'){clearTimeout(syncQueued);const mp=map(),active=propertyActive();"""
if s.count(oldsync)!=1: raise SystemExit(f"sync anchor {s.count(oldsync)}")
s=s.replace(oldsync,newsync,1)

oldexport="""window.earthlineDeclarePropertyAtCrosshair16169=declareProperty;window.earthlineSyncPropertyTexture16169=syncTexture;"""
newexport="""window.earthlineDeclarePropertyAtCrosshair16169=declareProperty;window.earthlineSyncPropertyTexture16169=syncTexture;window.earthlineResetPropertyTexture17383=resetPropertyTexture17383;"""
if s.count(oldexport)!=1: raise SystemExit(f"export anchor {s.count(oldexport)}")
s=s.replace(oldexport,newexport,1)

oldret="""      /* EARTHLINE 16534 — hide-only retirement. Do not clear source data here: the existing
         texture/living owners retain their caches and republish the new Property after commit. */
      const ids=[
        'earthline-living-swales-glow-15792','earthline-living-swales-earth-15792','earthline-living-swales-life-15792','earthline-living-swales-water-15792',
        'earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177',
        'earthline-swale-planting-shadow-15806','earthline-swale-planting-layer-15806',
        'earthline-property-flow-casing-15792','earthline-property-flow-line-15792','earthline-property-flow-pulse-15792','earthline-property-flow-arrows-15792'
      ];
      for(const id of ids){try{if(mp?.getLayer?.(id))mp.setLayoutProperty(id,'visibility','none')}catch(_){ }}
"""
newret="""      /* EARTHLINE 17383 — fail closed between Property generations.
         Retire presentation sources, not just layer visibility. Scientific/model state is
         untouched; the next committed generation repopulates these existing owners. */
      const ids=[
        'earthline-living-swales-glow-15792','earthline-living-swales-earth-15792','earthline-living-swales-life-15792','earthline-living-swales-water-15792',
        'earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177',
        'earthline-swale-planting-shadow-15806','earthline-swale-planting-layer-15806',
        'earthline-property-flow-casing-15792','earthline-property-flow-line-15792','earthline-property-flow-pulse-15792','earthline-property-flow-arrows-15792'
      ];
      const sourceIds17383=new Set(['earthline-property-swale-texture-16174','earthline-living-swales-15792']);
      for(const id of ids){
        try{
          const lyr=mp?.getLayer?.(id);
          if(lyr?.source)sourceIds17383.add(String(lyr.source));
          if(lyr)mp.setLayoutProperty(id,'visibility','none');
        }catch(_){}
      }
      try{if(typeof window.earthlineResetPropertyTexture17383==='function')window.earthlineResetPropertyTexture17383(reason)}catch(_){}
      const empty17383={type:'FeatureCollection',features:[]},cleared17383=[];
      for(const sid of sourceIds17383){
        try{const src=mp?.getSource?.(sid);if(src?.setData){src.setData(empty17383);cleared17383.push(sid)}}catch(_){}
      }
      window.EARTHLINE_PROPERTY_PRESENTATION_CLEAR_17383={reason,sources:cleared17383,at:new Date().toISOString()};
"""
if s.count(oldret)!=1: raise SystemExit(f"retire anchor {s.count(oldret)}")
s=s.replace(oldret,newret,1)

s="<!-- EARTHLINE_PROPERTY_CLEAN_RUN_17383: one-click crosshair binding + hard retirement of prior Property presentation sources. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched clean Property run ownership 17383")
