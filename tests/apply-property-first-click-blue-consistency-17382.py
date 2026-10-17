from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_click="""  async function declareProperty(e){
    e?.preventDefault?.();e?.stopPropagation?.();e?.stopImmediatePropagation?.();
    const governed=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof governed!=='function'){
      try{if(typeof earthlineReady==='function')earthlineReady('PROPERTY ANALYSIS BLOCKED — governed property controller is unavailable.')}catch(_){}
      return false;
    }
    const target=window.EARTHLINE_PROPERTY_TARGET_16201;
"""
new_click="""  async function declareProperty(e){
    e?.preventDefault?.();e?.stopPropagation?.();e?.stopImmediatePropagation?.();
    const governed=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof governed!=='function'){
      try{if(typeof earthlineReady==='function')earthlineReady('PROPERTY ANALYSIS BLOCKED — governed property controller is unavailable.')}catch(_){}
      return false;
    }
    /* EARTHLINE 17381 — the authoritative Property button owner binds the CURRENT
       map crosshair synchronously inside the same click that starts Property.
       No capture listener, preflight owner, second click, focus rerun, or camera move. */
    try{
      const mp17381=map(),c17381=mp17381?.getCenter?.();
      const lng17381=Number(c17381?.lng),lat17381=Number(c17381?.lat);
      if(Number.isFinite(lng17381)&&Number.isFinite(lat17381)){
        window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false;
        window.EARTHLINE_COUNTRY_TARGET_USER_UNLOCKED_17240=true;
        const prior17381=window.EARTHLINE_PROPERTY_TARGET_16201||null;
        const rebound17381={
          ...(prior17381&&typeof prior17381==='object'?prior17381:{}),
          lng:lng17381,lat:lat17381,source:'crosshair',
          at:new Date().toISOString()
        };
        if(typeof window.earthlineSetPropertyTarget16201==='function'){
          window.earthlineSetPropertyTarget16201(rebound17381,{openPanel:false});
        }else{
          window.EARTHLINE_PROPERTY_TARGET_16201=rebound17381;
        }
        window.EARTHLINE_PROPERTY_FIRST_CLICK_17381={
          state:'bound-and-starting',
          lng:lng17381,lat:lat17381,at:rebound17381.at
        };
      }
    }catch(_){}
    const target=window.EARTHLINE_PROPERTY_TARGET_16201;
"""
if s.count(old_click)!=1:
    raise SystemExit(f"declareProperty anchor count {s.count(old_click)}")
s=s.replace(old_click,new_click,1)

# 17386 — expose the authoritative handler as soon as the Property owner block
# is evaluated, before any Navigation Box reconciliation can touch the button.
old_expose="  function ensureDeclareButton(){"
new_expose="""  window.earthlinePropertyClickOwner16546=declareProperty;
  function ensureDeclareButton(){"""
if s.count(old_expose)!=1:
    raise SystemExit(f"early Property click owner anchor count {s.count(old_expose)}")
s=s.replace(old_expose,new_expose,1)

# 17385 — one Property click owner only. The Navigation Box may move/reconcile
# the button, but it must never replace the authoritative 16546 handler.
old_owner="b.onclick=declareProperty;b.dataset.earthlinePropertyClickOwner16546='current';return b}"
new_owner="b.onclick=declareProperty;window.earthlinePropertyClickOwner16546=declareProperty;b.dataset.earthlinePropertyClickOwner16546='current';return b}"
if s.count(old_owner)!=1:
    raise SystemExit(f"authoritative click exposure count {s.count(old_owner)}")
s=s.replace(old_owner,new_owner,1)

old_panel="property.onclick=function(ev){const fn=window.earthlineDeclarePropertyAtCrosshair16173;return typeof fn==='function'?fn(ev):false};"
panel_count=s.count(old_panel)
if panel_count<1:
    raise SystemExit("panel click overwrite anchor missing")
new_panel="if(typeof window.earthlinePropertyClickOwner16546==='function'){property.onclick=window.earthlinePropertyClickOwner16546;property.dataset.earthlinePropertyClickOwner16546='current'}"
s=s.replace(old_panel,new_panel)

anchor="""  function addLayer(spec,before){const mp=map();try{if(!mp.getLayer(spec.id))mp.addLayer(spec,before);return !!mp.getLayer(spec.id)}catch(_){return false}}
  async function ensureTextureLayers(){"""
insert="""  function addLayer(spec,before){const mp=map();try{if(!mp.getLayer(spec.id))mp.addLayer(spec,before);return !!mp.getLayer(spec.id)}catch(_){return false}}
  function normalizeTextureStyle17382(mp){
    try{
      const paint={
        footprint:{'fill-color':'#5d4a31','fill-opacity':.065,'fill-outline-color':'#163020'},
        casing:{'line-color':'#102117','line-opacity':.64,'line-width':26},
        neutral:{'line-color':'#7f9568','line-opacity':.66,'line-width':18,'line-dasharray':[1.25,.55]},
        up:{'line-pattern':IMG_UP,'line-opacity':.72,'line-width':22},
        flip:{'line-pattern':IMG_FLIP,'line-opacity':.72,'line-width':22}
      };
      for(const [k,id] of Object.entries(LAYERS)){
        if(!mp?.getLayer?.(id))continue;
        for(const [prop,val] of Object.entries(paint[k]||{}))mp.setPaintProperty(id,prop,val);
        mp.setLayoutProperty(id,'visibility','none');
      }
      mp.setFilter?.(LAYERS.footprint,['==',['get','geometry_role'],'footprint']);
      mp.setFilter?.(LAYERS.casing,['==',['get','geometry_role'],'centerline']);
      mp.setFilter?.(LAYERS.neutral,['all',['==',['get','geometry_role'],'centerline'],['==',['get','orientation_status'],'indeterminate']]);
      mp.setFilter?.(LAYERS.up,['all',['==',['get','geometry_role'],'centerline'],['==',['get','orientation_status'],'verified'],['==',['get','texture_flip'],0]]);
      mp.setFilter?.(LAYERS.flip,['all',['==',['get','geometry_role'],'centerline'],['==',['get','orientation_status'],'verified'],['==',['get','texture_flip'],1]]);
      return true;
    }catch(_){return false}
  }
  function resetTextureRun17382(){
    const mp=map();
    try{
      lastSignature='';
      const src=mp?.getSource?.(SOURCE);
      if(src?.setData)src.setData(EMPTY);
      normalizeTextureStyle17382(mp);
      if(typeof window.earthlineSetNaturalSwalePlantingVisible15806==='function')
        window.earthlineSetNaturalSwalePlantingVisible15806(false);
      for(const id of ['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221']){
        try{if(mp?.getLayer?.(id))mp.setPaintProperty(id,'line-opacity',.98)}catch(_){}
      }
      window.EARTHLINE_PROPERTY_TEXTURE_RESET_17382={at:new Date().toISOString(),searchGen:Number(model()?.searchGen||0)};
    }catch(_){}
  }
  async function ensureTextureLayers(){"""
if s.count(anchor)!=1:
    raise SystemExit(f"texture addLayer anchor count {s.count(anchor)}")
s=s.replace(anchor,insert,1)

old_cold="async function ensureTextureLayers(){const mp=map();if(!mp?.getStyle?.())return false;try{const style=mp.getStyle();"
new_cold="async function ensureTextureLayers(){const mp=map();if(!mp||typeof mp.getStyle!='function')return false;try{if(typeof mp.isStyleLoaded==='function'&&!mp.isStyleLoaded())return false;const style=mp.getStyle();"
if s.count(old_cold)!=1:
    raise SystemExit(f"cold style anchor count {s.count(old_cold)}")
s=s.replace(old_cold,new_cold,1)

old_return="""if(!await ensureImages())return false;const before=mp.getLayer?.('earthline-swales-casing')?'earthline-swales-casing':undefined;"""
new_return="""if(!await ensureImages())return false;const before=mp.getLayer?.('earthline-swales-casing')?'earthline-swales-casing':undefined;"""
# Keep same anchor but normalize after layers are created below.
if old_return not in s:
    raise SystemExit("ensureImages anchor missing")

old_filters="""addLayer({id:LAYERS.flip,type:'line',source:SOURCE,filter:['all',['==',['get','geometry_role'],'centerline'],['==',['get','orientation_status'],'verified'],['==',['get','texture_flip'],1]],layout:{'line-cap':'butt','line-join':'round'},paint:{'line-pattern':IMG_FLIP,'line-opacity':.72,'line-width':22}},before);try{mp.setFilter?.(LAYERS.neutral,['all',['==',['get','geometry_role'],'centerline'],['==',['get','orientation_status'],'indeterminate']]);mp.setFilter?.(LAYERS.up,['all',['==',['get','geometry_role'],'centerline'],['==',['get','orientation_status'],'verified'],['==',['get','texture_flip'],0]]);mp.setFilter?.(LAYERS.flip,['all',['==',['get','geometry_role'],'centerline'],['==',['get','orientation_status'],'verified'],['==',['get','texture_flip'],1]])}catch(_){}return Object.values(LAYERS).every(id=>!!mp.getLayer?.(id))}"""
new_filters="""addLayer({id:LAYERS.flip,type:'line',source:SOURCE,filter:['all',['==',['get','geometry_role'],'centerline'],['==',['get','orientation_status'],'verified'],['==',['get','texture_flip'],1]],layout:{'line-cap':'butt','line-join':'round'},paint:{'line-pattern':IMG_FLIP,'line-opacity':.72,'line-width':22}},before);normalizeTextureStyle17382(mp);return Object.values(LAYERS).every(id=>!!mp.getLayer?.(id))}"""
if s.count(old_filters)!=1:
    raise SystemExit(f"texture filters anchor count {s.count(old_filters)}")
s=s.replace(old_filters,new_filters,1)

# Reset texture state from the same authoritative click owner before starting the run.
old_start="""    const target=window.EARTHLINE_PROPERTY_TARGET_16201;
    const hasTarget=!!(target&&Number.isFinite(Number(target.lng))&&Number.isFinite(Number(target.lat)));"""
new_start="""    resetTextureRun17382();
    const target=window.EARTHLINE_PROPERTY_TARGET_16201;
    const hasTarget=!!(target&&Number.isFinite(Number(target.lng))&&Number.isFinite(Number(target.lat)));"""
if s.count(old_start)!=1:
    raise SystemExit(f"target anchor count {s.count(old_start)}")
s=s.replace(old_start,new_start,1)

# Make final renderer choice deterministic once source/images/layers are ready.
old_safe="""const safeOpacity17172=naturalRendered17172>0?0:.98;for(const id of ['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221']){try{if(mp.getLayer?.(id))mp.setPaintProperty(id,'line-opacity',safeOpacity17172)}catch(_){}}"""
new_safe="""const safeOpacity17172=naturalRendered17172>0?0:.98;for(const id of ['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221']){try{if(mp.getLayer?.(id))mp.setPaintProperty(id,'line-opacity',safeOpacity17172)}catch(_){}}if(!naturalRendered17172&&show&&!String(reason).includes('natural-settle-force'))setTimeout(()=>syncTexture('natural-settle-force'),260);"""
if s.count(old_safe)!=1:
    raise SystemExit(f"safeOpacity anchor count {s.count(old_safe)}")
s=s.replace(old_safe,new_safe,1)

# Expose deterministic renderer state for repeat-run gate.
audit_anchor="""const registered={up:!!mp.hasImage?.(IMG_UP),flip:!!mp.hasImage?.(IMG_FLIP)};window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169={"""
audit_new="""const registered={up:!!mp.hasImage?.(IMG_UP),flip:!!mp.hasImage?.(IMG_FLIP)};window.EARTHLINE_PROPERTY_RENDER_STYLE_17382={upOpacity:mp.getPaintProperty?.(LAYERS.up,'line-opacity'),flipOpacity:mp.getPaintProperty?.(LAYERS.flip,'line-opacity'),upPattern:mp.getPaintProperty?.(LAYERS.up,'line-pattern'),flipPattern:mp.getPaintProperty?.(LAYERS.flip,'line-pattern'),casingOpacity:mp.getPaintProperty?.(LAYERS.casing,'line-opacity'),neutralOpacity:mp.getPaintProperty?.(LAYERS.neutral,'line-opacity'),safeWaterOpacity:mp.getLayer?.('earthline-property-safe-water-16221')?mp.getPaintProperty?.('earthline-property-safe-water-16221','line-opacity'):null,at:new Date().toISOString()};window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169={"""
if s.count(audit_anchor)!=1:
    raise SystemExit(f"audit anchor count {s.count(audit_anchor)}")
s=s.replace(audit_anchor,audit_new,1)

s="<!-- EARTHLINE_PROPERTY_FIRST_CLICK_BLUE_CONSISTENCY_17382: same-click crosshair handoff + deterministic Property texture state. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched Property first-click and texture consistency 17382")
