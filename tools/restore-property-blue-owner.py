from pathlib import Path
import re

p=Path("index.html")
s=p.read_text(encoding="utf-8")
original=s

old_specs="""    const specs=[
      {id:SAFE_LAYERS_16221.casing,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#123d24','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,4,17,6,20,8]}},
      {id:SAFE_LAYERS_16221.earth,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#7a5738','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,3.2,17,4.8,20,6.2]}},
      {id:SAFE_LAYERS_16221.life,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#56a862','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,2,17,3,20,4],'line-offset':['interpolate',['linear'],['zoom'],14,-.55,17,-.9,20,-1.25],'line-dasharray':[.7,.38]}},
      {id:SAFE_LAYERS_16221.water,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#3aaee8','line-opacity':.88,'line-width':['interpolate',['linear'],['zoom'],14,1.4,17,2.2,20,3],'line-offset':['interpolate',['linear'],['zoom'],14,.45,17,.75,20,1.05]}}
    ];"""
new_specs="""    const specs=[
      {id:SAFE_LAYERS_16221.casing,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#0a4772','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,4,17,6,20,8]}},
      {id:SAFE_LAYERS_16221.earth,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#1389c2','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,3.2,17,4.8,20,6.2]}},
      {id:SAFE_LAYERS_16221.life,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#67d6ff','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,1.7,17,2.6,20,3.4],'line-offset':['interpolate',['linear'],['zoom'],14,-.62,17,-1.02,20,-1.42],'line-dasharray':[.72,.46]}},
      {id:SAFE_LAYERS_16221.water,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#19a9e8','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,1.7,17,2.6,20,3.4],'line-offset':['interpolate',['linear'],['zoom'],14,.62,17,1.02,20,1.42],'line-dasharray':[.72,.46]}}
    ];"""
if s.count(old_specs)!=1:
    raise SystemExit(f"safe-line definition owner mismatch: {s.count(old_specs)}")
s=s.replace(old_specs,new_specs,1)

delegation=re.compile(
    r"""    /\* EARTHLINE M76 — this is a fallback, not a second final renderer\..*?
    if\(naturalReady16221 && naturalRendered16221>0\)\{.*?
      return \{ok:true,count,visible:false,active,delegatedToNatural:true,audit\};
    \}
    setSafeLayerVisibility16221\(true\);""",
    re.S
)
replacement="""    /* Authoritative Property presentation: verified safe geometry owns the final display. */
    const naturalLayerIds16221=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177'];
    for(const id of naturalLayerIds16221){try{if(mp.getLayer?.(id))mp.setLayoutProperty(id,'visibility','none')}catch(_){}}
    try{if(typeof window.earthlineSetNaturalSwalePlantingVisible15806==='function')window.earthlineSetNaturalSwalePlantingVisible15806(false)}catch(_){}
    setSafeLayerVisibility16221(true);"""
s,n=delegation.subn(replacement,s,count=1)
if n!=1:
    raise SystemExit(f"safe-line ownership replacement mismatch: {n}")

texture_owner=re.compile(
    r"""for\(const id of Object\.values\(LAYERS\)\)visible\(id,show\);if\(show\)\{.*?\}else\{/\* If the natural renderer is unavailable, restore the verified authoritative safe-line fallback so Property output never disappears\. \*/.*?\}\}const overlay=""",
    re.S
)
texture_replacement="""for(const id of Object.values(LAYERS))visible(id,false);for(const id of ['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221']){try{if(mp.getLayer?.(id)){mp.setLayoutProperty?.(id,'visibility','visible');mp.setPaintProperty?.(id,'line-opacity',.98);mp.moveLayer?.(id)}}catch(_){}}try{if(typeof window.earthlineSetNaturalSwalePlantingVisible15806==='function')window.earthlineSetNaturalSwalePlantingVisible15806(false)}catch(_){}const overlay="""
s,n=texture_owner.subn(texture_replacement,s,count=1)
if n!=1:
    raise SystemExit(f"natural presentation ownership replacement mismatch: {n}")

s=s.replace(
    "'property bioswales use an embedded lightweight repeatable natural tile'",
    "'property bioswales use the authoritative blue safe-line presentation from verified safe geometry'",
    1
)

if s==original:
    raise SystemExit("no product change")
if "const safeOpacity17172=0" in s:
    raise SystemExit("obsolete natural ownership remains")
if "'line-color':'#123d24'" in s or "'line-color':'#7a5738'" in s or "'line-color':'#56a862'" in s:
    raise SystemExit("obsolete Property colors remain in canonical safe-line definitions")
if s.count("'line-dasharray':[.72,.46]") < 2:
    raise SystemExit("two dotted blue strips not established")

p.write_text(s,encoding="utf-8")
print("PASS canonical Property presentation owner restored to authoritative blue safe lines")
