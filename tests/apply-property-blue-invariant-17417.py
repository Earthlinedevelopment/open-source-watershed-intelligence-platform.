from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

anchor="""  function addLayer(spec,before){const mp=map();try{if(!mp.getLayer(spec.id))mp.addLayer(spec,before);return !!mp.getLayer(spec.id)}catch(_){return false}}
  async function ensureTextureLayers(){"""
insert="""  function addLayer(spec,before){const mp=map();try{if(!mp.getLayer(spec.id))mp.addLayer(spec,before);return !!mp.getLayer(spec.id)}catch(_){return false}}
  function normalizeTextureStyle17417(mp){
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
      }
      mp.setFilter?.(LAYERS.footprint,['==',['get','geometry_role'],'footprint']);
      mp.setFilter?.(LAYERS.casing,['==',['get','geometry_role'],'centerline']);
      mp.setFilter?.(LAYERS.neutral,['all',['==',['get','geometry_role'],'centerline'],['==',['get','orientation_status'],'indeterminate']]);
      mp.setFilter?.(LAYERS.up,['all',['==',['get','geometry_role'],'centerline'],['==',['get','orientation_status'],'verified'],['==',['get','texture_flip'],0]]);
      mp.setFilter?.(LAYERS.flip,['all',['==',['get','geometry_role'],'centerline'],['==',['get','orientation_status'],'verified'],['==',['get','texture_flip'],1]]);
      return true;
    }catch(_){return false}
  }
  async function ensureTextureLayers(){"""
if s.count(anchor)!=1: raise SystemExit(f"texture owner anchor count {s.count(anchor)}")
s=s.replace(anchor,insert,1)

old_filters="""addLayer({id:LAYERS.flip,type:'line',source:SOURCE,filter:['all',['==',['get','geometry_role'],'centerline'],['==',['get','orientation_status'],'verified'],['==',['get','texture_flip'],1]],layout:{'line-cap':'butt','line-join':'round'},paint:{'line-pattern':IMG_FLIP,'line-opacity':.72,'line-width':22}},before);try{mp.setFilter?.(LAYERS.neutral,['all',['==',['get','geometry_role'],'centerline'],['==',['get','orientation_status'],'indeterminate']]);mp.setFilter?.(LAYERS.up,['all',['==',['get','geometry_role'],'centerline'],['==',['get','orientation_status'],'verified'],['==',['get','texture_flip'],0]]);mp.setFilter?.(LAYERS.flip,['all',['==',['get','geometry_role'],'centerline'],['==',['get','orientation_status'],'verified'],['==',['get','texture_flip'],1]])}catch(_){}return Object.values(LAYERS).every(id=>!!mp.getLayer?.(id))}"""
new_filters="""addLayer({id:LAYERS.flip,type:'line',source:SOURCE,filter:['all',['==',['get','geometry_role'],'centerline'],['==',['get','orientation_status'],'verified'],['==',['get','texture_flip'],1]],layout:{'line-cap':'butt','line-join':'round'},paint:{'line-pattern':IMG_FLIP,'line-opacity':.72,'line-width':22}},before);normalizeTextureStyle17417(mp);return Object.values(LAYERS).every(id=>!!mp.getLayer?.(id))}"""
if s.count(old_filters)!=1: raise SystemExit(f"texture filter anchor count {s.count(old_filters)}")
s=s.replace(old_filters,new_filters,1)

old_safe="""const safeOpacity17172=naturalRendered17172>0?0:.98;for(const id of ['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221']){try{if(mp.getLayer?.(id))mp.setPaintProperty(id,'line-opacity',safeOpacity17172)}catch(_){}}"""
new_safe="""const safeOpacity17172=0;for(const id of ['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221']){try{if(mp.getLayer?.(id))mp.setPaintProperty(id,'line-opacity',safeOpacity17172)}catch(_){}}"""
if s.count(old_safe)!=1: raise SystemExit(f"safe renderer anchor count {s.count(old_safe)}")
s=s.replace(old_safe,new_safe,1)

audit="""const registered={up:!!mp.hasImage?.(IMG_UP),flip:!!mp.hasImage?.(IMG_FLIP)};window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169={"""
audit_new="""const registered={up:!!mp.hasImage?.(IMG_UP),flip:!!mp.hasImage?.(IMG_FLIP)};window.EARTHLINE_PROPERTY_BLUE_STYLE_17417={upOpacity:mp.getPaintProperty?.(LAYERS.up,'line-opacity'),flipOpacity:mp.getPaintProperty?.(LAYERS.flip,'line-opacity'),upPattern:mp.getPaintProperty?.(LAYERS.up,'line-pattern'),flipPattern:mp.getPaintProperty?.(LAYERS.flip,'line-pattern'),casingOpacity:mp.getPaintProperty?.(LAYERS.casing,'line-opacity'),casingWidth:mp.getPaintProperty?.(LAYERS.casing,'line-width'),neutralOpacity:mp.getPaintProperty?.(LAYERS.neutral,'line-opacity'),neutralWidth:mp.getPaintProperty?.(LAYERS.neutral,'line-width'),safeWaterOpacity:mp.getLayer?.('earthline-property-safe-water-16221')?mp.getPaintProperty?.('earthline-property-safe-water-16221','line-opacity'):null,at:new Date().toISOString()};window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169={"""
if s.count(audit)!=1: raise SystemExit(f"texture audit anchor count {s.count(audit)}")
s=s.replace(audit,audit_new,1)

s="<!-- EARTHLINE_PROPERTY_BLUE_INVARIANT_17417: authoritative texture owner reasserts identical paint/filter recipe on every sync. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed deterministic Property blue invariant 17417")
