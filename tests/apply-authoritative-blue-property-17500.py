from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

marker="EARTHLINE_PROPERTY_AUTHORITATIVE_BLUE_PRESENTATION_17500"
if marker in s:
    raise SystemExit(0)

old_visibility="for(const id of Object.values(LAYERS))visible(id,show);if(show){for(const id of OLD)visible(id,false);"
new_visibility="for(const id of Object.values(LAYERS))visible(id,false);if(show){for(const id of OLD)visible(id,false);"
if s.count(old_visibility)!=1:
    raise SystemExit(f"presentation visibility owner count {s.count(old_visibility)}")
s=s.replace(old_visibility,new_visibility,1)

old_safe="const safeOpacity17172=0;for(const id of ['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221']){try{if(mp.getLayer?.(id))mp.setPaintProperty(id,'line-opacity',safeOpacity17172)}catch(_){}}"
new_safe="""/* EARTHLINE_PROPERTY_AUTHORITATIVE_BLUE_PRESENTATION_17500
   Presentation ownership only. Authoritative safe geometry remains unchanged.
   Natural texture is non-authoritative; two blue dotted traces carry the visible swale identity. */
const safeStyle17500={
  'earthline-property-safe-casing-16221':{'line-color':'#0b3558','line-opacity':.96},
  'earthline-property-safe-earth-16221':{'line-color':'#246f9e','line-opacity':.94},
  'earthline-property-safe-life-16221':{'line-color':'#55c8ff','line-opacity':1,'line-dasharray':[.72,.46]},
  'earthline-property-safe-water-16221':{'line-color':'#159de0','line-opacity':1,'line-dasharray':[.72,.46]}
};
for(const [id,paint17500] of Object.entries(safeStyle17500)){try{
  if(!mp.getLayer?.(id))continue;
  mp.setLayoutProperty?.(id,'visibility','visible');
  for(const [prop17500,val17500] of Object.entries(paint17500))mp.setPaintProperty?.(id,prop17500,val17500);
  mp.moveLayer?.(id);
}catch(_){}}
"""
if s.count(old_safe)!=1:
    raise SystemExit(f"safe presentation owner count {s.count(old_safe)}")
s=s.replace(old_safe,new_safe,1)

old_plant="window.earthlineSetNaturalSwalePlantingVisible15806(true)"
if s.count(old_plant)!=1:
    raise SystemExit(f"planting visibility owner count {s.count(old_plant)}")
s=s.replace(old_plant,"window.earthlineSetNaturalSwalePlantingVisible15806(false)",1)

# The texture owner's own audit must not reassert the obsolete natural appearance after the safe owner is established.
old_return="return show&&registered.up&&registered.flip}"
if s.count(old_return)<1:
    raise SystemExit("texture return owner unavailable")
s=s.replace(old_return,"return show}",1)

p.write_text(s,encoding="utf-8")

if s.count(marker)!=1:
    raise SystemExit("authoritative blue marker mismatch")
print("installed authoritative blue Property presentation owner 17500")
