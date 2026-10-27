from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""if(show){for(const id of OLD)visible(id,false);/* 17172: fail visibly. Keep the authoritative safe Property swales opaque until the natural-texture replacement is actually rendered, not merely source-ready. */let naturalRendered17172=0;try{const canvas17172=mp.getCanvas?.();const box17172=canvas17172&&[[0,0],[canvas17172.clientWidth||canvas17172.width,canvas17172.clientHeight||canvas17172.height]];const ids17172=[LAYERS.casing,LAYERS.neutral,LAYERS.up,LAYERS.flip].filter(id=>mp.getLayer?.(id));if(box17172&&ids17172.length)naturalRendered17172=(mp.queryRenderedFeatures?.(box17172,{layers:ids17172})||[]).length}catch(_){}const safeOpacity17172=naturalRendered17172>0?0:.98;for(const id of ['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221']){try{if(mp.getLayer?.(id))mp.setPaintProperty(id,'line-opacity',safeOpacity17172)}catch(_){}}"""
new="""if(show){for(const id of OLD)visible(id,false);/* EARTHLINE 17408 — deterministic Property renderer ownership. ensureTextureLayers() and complete oriented features are already proven above, so natural texture is the sole visible swale presentation. The verified safe-line fallback remains owned by the !show/unavailable branch; renderer choice no longer depends on queryRenderedFeatures timing. */const safeOpacity17172=0;for(const id of ['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221']){try{if(mp.getLayer?.(id))mp.setPaintProperty(id,'line-opacity',safeOpacity17172)}catch(_){}}"""
if s.count(old)!=1:
    raise SystemExit(f"Property renderer timing anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_PROPERTY_BLUE_INVARIANT_17408: deterministic natural-texture ownership; fallback only when natural owner unavailable. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed deterministic Property swale renderer ownership 17408")
