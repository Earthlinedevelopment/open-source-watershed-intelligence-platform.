from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")

# 1. Native Mapbox ownership is based on an actual map canvas, not map.loaded().
old="const nativePropertyBasemap16348=earthlineMapActive();"
new="const nativePropertyBasemap16348=!!(earthlineMap&&earthlineMap.getCanvas&&earthlineMap.getCanvas());"
if s.count(old)!=1: raise SystemExit(f"native property owner count {s.count(old)}")
s=s.replace(old,new,1)

old="const native16348=earthlineMapActive();"
new="const native16348=!!(earthlineMap&&earthlineMap.getCanvas&&earthlineMap.getCanvas());"
if s.count(old)!=3: raise SystemExit(f"native camera owner count {s.count(old)}")
s=s.replace(old,new)

# 2. Do not release the Property lifecycle before presentation truth settles.
old="""      /* EARTHLINE 16334 — verified science is the interactive terminal. Optional
         presentation verification continues, but the Property control is released now. */
      running=false;
      document.documentElement.dataset.earthlinePropertyRunState='idle';
      document.documentElement.classList.remove('earthline-property-running-16233');
      clearTimers();setButton(false);clearAllBusy();restoreGrab();
      try{window.getSelection?.()?.removeAllRanges?.();button()?.blur?.()}catch(_){}

"""
new="""      /* EARTHLINE 17703 — scientific truth is terminal here, but the governed
         Property lifecycle remains active until current-viewport presentation
         truth is verified. Final cleanup remains owned by terminalPropertyRun. */

"""
if s.count(old)!=1: raise SystemExit(f"early release block count {s.count(old)}")
s=s.replace(old,new,1)

# 3. Current-viewport visibility owner: no stale audit may certify Property.
start=s.index("  function propertyLivingMapVisible16262(count){")
end=s.index("\n  function settlePropertyMapVisibility16260",start)
old=s[start:end]
new="""  function propertyBasemapReady16262(){
    try{
      const mp=map();
      if(!mp||!mp.getCanvas?.())return false;
      return typeof mp.areTilesLoaded==='function'?mp.areTilesLoaded()===true:true;
    }catch(_){return false}
  }

  function propertyLivingMapVisible16262(count){
    try{
      const mp=map();
      if(!mp||!mp.getCanvas?.())return {ok:false,count:Number(count||0),reason:'map-canvas-unavailable'};
      if(!propertyBasemapReady16262())return {ok:false,count:Number(count||0),reason:'basemap-tiles-pending'};
      const layerIds=[
        'earthline-living-swales-glow-15792','earthline-living-swales-earth-15792',
        'earthline-living-swales-life-15792','earthline-living-swales-water-15792',
        'earthline-property-swale-natural-casing-16174','earthline-property-swale-neutral-16177',
        'earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174'
      ].filter(id=>mp.getLayer?.(id));
      const canvas=mp.getCanvas?.();
      const box=canvas&&[[0,0],[canvas.clientWidth||canvas.width,canvas.clientHeight||canvas.height]];
      const rendered=(box&&layerIds.length)?(mp.queryRenderedFeatures?.(box,{layers:layerIds})||[]):[];
      if(rendered.length>0){
        let audit=null;
        try{audit=typeof window.earthlineDisplayAudit15882==='function'?window.earthlineDisplayAudit15882():null}catch(_){}
        return {ok:true,mode:'current-viewport-property-swales-17703',count:Number(count||0),renderedFeatures:rendered.length,layers:layerIds,audit};
      }
      return {ok:false,count:Number(count||0),reason:'current-viewport-swales-not-rendered',layers:layerIds};
    }catch(error){return {ok:false,count:Number(count||0),reason:String(error?.message||error)}}
  }
"""
s=s[:start]+new+s[end:]

# 4. Settlement is awaited and requires both basemap tiles and current viewport swales.
start=s.index("  function settlePropertyMapVisibility16260(count,texture,serial){")
end=s.index("\n\n  /* EARTHLINE 16529",start)
old=s[start:end]
new="""  async function settlePropertyMapVisibility16260(count,texture,serial){
    if(!(count>0))return {ok:true,mode:'verified-zero'};
    let last=null;
    for(const delay of [120,280,520,900,1300,1800]){
      await new Promise(r=>setTimeout(r,delay));
      if(serial!==runSerial)return {ok:false,superseded:true};
      const living16262=propertyLivingMapVisible16262(count);
      if(living16262.ok){
        const current=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
        const authoritative16516=typeof window.earthlinePropertyEvidenceIsAuthoritative16516==='function'&&window.earthlinePropertyEvidenceIsAuthoritative16516();
        status(authoritative16516?('Property detail published — '+count+' exclusion-verified bioswale corridor'+(count===1?' is':'s are')+' visible on the Property map.'):('Property detail published — '+count+' screened bioswale corridor'+(count===1?' is':'s are')+' visible on the Property map. Field verification required.'),'published');
        setTierNotice('property',authoritative16516?('PROPERTY DETAIL · '+count+' VERIFIED SAFE CORRIDORS VISIBLE'):('PROPERTY DETAIL · '+count+' SCREENED CORRIDORS · FIELD VERIFY'));
        setAudit({settled:true,result:true,corridors:count,renderVerified:true,renderPending:false,renderMode:living16262.mode,mapEvidence:living16262,texture,currentScientificResultPreserved:true,mapVerificationSettledAt:new Date().toISOString(),settledAt:current.settledAt||new Date().toISOString()});
        return {ok:true,mode:living16262.mode,evidence:living16262};
      }
      last=syncSafePropertyFallback16221('post-terminal-17703-'+delay);
      if(propertyBasemapReady16262()&&last?.ok){
        const current=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
        const authoritative16516=typeof window.earthlinePropertyEvidenceIsAuthoritative16516==='function'&&window.earthlinePropertyEvidenceIsAuthoritative16516();
        status(authoritative16516?('Property detail published — '+count+' exclusion-verified bioswale corridor'+(count===1?' is':'s are')+' visible from the authoritative safe Property geometry.'):('Property detail published — '+count+' screened bioswale corridor'+(count===1?' is':'s are')+' visible from the current Property geometry. Field verification required.'),'published');
        setTierNotice('property',authoritative16516?('PROPERTY DETAIL · '+count+' VERIFIED SAFE CORRIDORS VISIBLE'):('PROPERTY DETAIL · '+count+' SCREENED CORRIDORS · FIELD VERIFY'));
        setAudit({settled:true,result:true,corridors:count,renderVerified:true,renderPending:false,renderMode:'authoritative-safe-lines',safeFallback:last,texture,currentScientificResultPreserved:true,mapVerificationSettledAt:new Date().toISOString(),settledAt:current.settledAt||new Date().toISOString()});
        return {ok:true,mode:'authoritative-safe-lines',evidence:last};
      }
    }
    const reason=last?.error||'current Property basemap/swales did not become render-visible inside the bounded settlement window';
    status('PROPERTY RESULT VERIFIED — '+count+' safe corridor'+(count===1?' was':'s were')+' found, but the current map presentation did not verify ('+reason+'). No incomplete Property display was accepted.','failed');
    setTierNotice('warning','PROPERTY DETAIL · ANALYSIS VERIFIED · MAP LAYER NOT VERIFIED');
    setAudit({settled:true,result:false,corridors:count,renderVerified:false,renderPending:false,renderMode:'none',safeFallback:last||null,texture,currentScientificResultPreserved:true,mapVerificationSettledAt:null,settledAt:new Date().toISOString()});
    return {ok:false,reason};
  }"""
s=s[:start]+new+s[end:]

# 5. Immediate terminal acceptance must use current viewport truth, not source-ready texture.
old="const renderVerified=count===0||safeFallback.ok||texture.ok;"
new="""const liveNow16262=propertyLivingMapVisible16262(count);
      const renderVerified=count===0||(propertyBasemapReady16262()&&(safeFallback.ok||liveNow16262.ok));"""
if s.count(old)!=1: raise SystemExit(f"renderVerified target count {s.count(old)}")
s=s.replace(old,new,1)

old="""        settlePropertyMapVisibility16260(count,texture,serial);
        /* EARTHLINE 17512 — Elder already published at verified scientific terminal. */
        return true;"""
new="""        const presentation17703=await settlePropertyMapVisibility16260(count,texture,serial);
        /* EARTHLINE 17512 — Elder already published at verified scientific terminal. */
        return presentation17703&&presentation17703.ok===true;"""
if s.count(old)!=1: raise SystemExit(f"settlement await target count {s.count(old)}")
s=s.replace(old,new,1)

# 6. Immediate success status/renderMode follows actual visible owner.
old="if(count>0&&texture.ok){const d=Number(texture.directional||0),n=Number(texture.neutral||0),authoritative16516="
new="if(count>0&&liveNow16262.ok){const d=Number(texture.directional||0),n=Number(texture.neutral||0),authoritative16516="
if s.count(old)!=1: raise SystemExit(f"visible owner branch count {s.count(old)}")
s=s.replace(old,new,1)

old="renderMode:texture.ok?'natural-texture':(safeFallback.ok?'authoritative-safe-lines':'verified-zero')"
new="renderMode:liveNow16262.ok?liveNow16262.mode:(safeFallback.ok?'authoritative-safe-lines':'verified-zero')"
if s.count(old)!=1: raise SystemExit(f"render mode count {s.count(old)}")
s=s.replace(old,new,1)

p.write_text(s)
print("EARTHLINE_PROPERTY_PRESENTATION_TRUTH_17703_OK")
