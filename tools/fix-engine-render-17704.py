from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")

# Restore the pre-17485 conservative Property channel buffer.
old="M.earthlinePropertyChannelBuffer17485=!isRegionalTile15769;"
new="M.earthlinePropertyChannelBuffer17485=false;"
if s.count(old)!=1: raise SystemExit(f"channel owner count {s.count(old)}, expected 1")
s=s.replace(old,new,1)

# Current-viewport natural texture is the only enhanced renderer that may take ownership.
old="""      const layerIds=[
        'earthline-living-swales-glow-15792','earthline-living-swales-earth-15792',
        'earthline-living-swales-life-15792','earthline-living-swales-water-15792',
        'earthline-property-swale-natural-casing-16174','earthline-property-swale-neutral-16177',
        'earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174'
      ].filter(id=>mp.getLayer?.(id));"""
new="""      const layerIds=[
        'earthline-property-swale-natural-casing-16174','earthline-property-swale-neutral-16177',
        'earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174'
      ].filter(id=>mp.getLayer?.(id));"""
if s.count(old)!=1: raise SystemExit(f"natural viewport layer set count {s.count(old)}, expected 1")
s=s.replace(old,new,1)

# Atomic single-owner helper: safe fallback OR natural texture, never stacked with legacy living swales.
marker="""  async function settlePropertyMapVisibility16260(count,texture,serial){"""
helper="""  function earthlinePropertyRendererOwner17704(owner){
    const mp=map();if(!mp)return false;
    const safeIds=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'];
    const legacyIds=['earthline-living-swales-glow-15792','earthline-living-swales-earth-15792','earthline-living-swales-life-15792','earthline-living-swales-water-15792'];
    const naturalIds=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-neutral-16177','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174'];
    const show=(id,on)=>{try{if(mp.getLayer?.(id))mp.setLayoutProperty(id,'visibility',on?'visible':'none')}catch(_){}};
    for(const id of legacyIds)show(id,false);
    if(owner==='natural'){
      setSafeLayerVisibility16221(false);
      for(const id of naturalIds)show(id,true);
      try{if(typeof window.earthlineSetNaturalSwalePlantingVisible15806==='function')window.earthlineSetNaturalSwalePlantingVisible15806(true)}catch(_){}
    }else if(owner==='safe'){
      for(const id of naturalIds)show(id,false);
      try{if(typeof window.earthlineSetNaturalSwalePlantingVisible15806==='function')window.earthlineSetNaturalSwalePlantingVisible15806(false)}catch(_){}
      setSafeLayerVisibility16221(true);
    }
    try{mp.triggerRepaint?.()}catch(_){}
    window.EARTHLINE_PROPERTY_RENDER_OWNER_17704={owner,at:new Date().toISOString()};
    return true;
  }

"""
if s.count(marker)!=1: raise SystemExit(f"settle marker count {s.count(marker)}, expected 1")
s=s.replace(marker,helper+marker,1)

# Natural success takes sole ownership before terminal state is published.
needle="""      if(living16262.ok){
        const current=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};"""
repl="""      if(living16262.ok){
        earthlinePropertyRendererOwner17704('natural');
        const current=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};"""
if s.count(needle)!=1: raise SystemExit(f"natural settle branch count {s.count(needle)}, expected 1")
s=s.replace(needle,repl,1)

# Safe success takes sole ownership, preventing legacy/living overlap.
needle="""      if(propertyBasemapReady16262()&&last?.ok){
        const current=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};"""
repl="""      if(propertyBasemapReady16262()&&last?.ok){
        earthlinePropertyRendererOwner17704('safe');
        const current=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};"""
if s.count(needle)!=1: raise SystemExit(f"safe settle branch count {s.count(needle)}, expected 1")
s=s.replace(needle,repl,1)

# Immediate verified natural path also owns presentation atomically.
needle="""      if(count>0&&liveNow16262.ok){const d=Number(texture.directional||0),n=Number(texture.neutral||0),authoritative16516="""
repl="""      if(count>0&&liveNow16262.ok){earthlinePropertyRendererOwner17704('natural');const d=Number(texture.directional||0),n=Number(texture.neutral||0),authoritative16516="""
if s.count(needle)!=1: raise SystemExit(f"immediate natural owner count {s.count(needle)}, expected 1")
s=s.replace(needle,repl,1)

# Immediate safe path also owns presentation atomically.
needle="""      else if(count>0&&safeFallback.ok){const authoritative16516="""
repl="""      else if(count>0&&safeFallback.ok){earthlinePropertyRendererOwner17704('safe');const authoritative16516="""
if s.count(needle)!=1: raise SystemExit(f"immediate safe owner count {s.count(needle)}, expected 1")
s=s.replace(needle,repl,1)

p.write_text(s)
print("EARTHLINE_M75_ENGINE_RENDER_REPAIR_17704_OK")
