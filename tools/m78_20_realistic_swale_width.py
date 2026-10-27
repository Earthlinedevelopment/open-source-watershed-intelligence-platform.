from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE M78.20 — realistic non-overlapping Property swale presentation"
if marker in s:
    raise SystemExit(0)

repls=[
("""      {id:SAFE_LAYERS_16221.casing,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#123d24','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,10,17,20,20,30]}},
      {id:SAFE_LAYERS_16221.earth,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#7a5738','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,7,17,15,20,23]}},
      {id:SAFE_LAYERS_16221.life,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#56a862','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,4.5,17,9,20,14],'line-offset':['interpolate',['linear'],['zoom'],14,-1.5,17,-3.2,20,-4.8],'line-dasharray':[.7,.38]}},
      {id:SAFE_LAYERS_16221.water,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#3aaee8','line-opacity':.82,'line-width':['interpolate',['linear'],['zoom'],14,2.6,17,5.2,20,7.2],'line-offset':['interpolate',['linear'],['zoom'],14,1.2,17,2.2,20,3.2]}}""",
"""      {id:SAFE_LAYERS_16221.casing,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#123d24','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,4,17,6,20,8]}},
      {id:SAFE_LAYERS_16221.earth,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#7a5738','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,3.2,17,4.8,20,6.2]}},
      {id:SAFE_LAYERS_16221.life,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#56a862','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,2,17,3,20,4],'line-offset':['interpolate',['linear'],['zoom'],14,-.55,17,-.9,20,-1.25],'line-dasharray':[.7,.38]}},
      {id:SAFE_LAYERS_16221.water,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#3aaee8','line-opacity':.88,'line-width':['interpolate',['linear'],['zoom'],14,1.4,17,2.2,20,3],'line-offset':['interpolate',['linear'],['zoom'],14,.45,17,.75,20,1.05]}}"""),
("function widthPx(){const z=Number(map()?.getZoom?.()||17);/* 16325 presentation only: scientific/footprint geometry remains 9 m. */",
 "function widthPx(){const z=Number(map()?.getZoom?.()||17);/* EARTHLINE M78.20 — realistic non-overlapping Property swale presentation; natural footprint is 3 m. */"),
("const ring=bufferedRing(coords,4.5);","const ring=bufferedRing(coords,1.5);"),
("swale_width_m:9,","swale_width_m:3,"),
("groundWidthM:9,","groundWidthM:3,"),
("'property swale width converges to a 9 m ground footprint'","'property swale width converges to a 3 m ground footprint'")
]
for old,new in repls:
    if old not in s:
        raise SystemExit("M78.20 anchor missing: "+old[:90])
    s=s.replace(old,new,1)

# Initial natural-layer paint should never flash at the old huge widths before sync refinement.
s=s.replace("casing:{'line-color':'#6b4d32','line-opacity':.88,'line-width':26}","casing:{'line-color':'#6b4d32','line-opacity':.88,'line-width':7}",1)
s=s.replace("neutral:{'line-color':'#5f985c','line-opacity':.86,'line-width':18,'line-dasharray':[1.25,.55]}","neutral:{'line-color':'#5f985c','line-opacity':.86,'line-width':3.2,'line-dasharray':[1.25,.55]}",1)
s=s.replace("up:{'line-pattern':IMG_UP,'line-opacity':.90,'line-width':22}","up:{'line-pattern':IMG_UP,'line-opacity':.90,'line-width':3.6}",1)
s=s.replace("flip:{'line-pattern':IMG_FLIP,'line-opacity':.90,'line-width':22}","flip:{'line-pattern':IMG_FLIP,'line-opacity':.90,'line-width':3.6}",1)

if marker not in s or "groundWidthM:3" not in s or "bufferedRing(coords,1.5)" not in s:
    raise SystemExit("M78.20 verification failed")
p.write_text(s,encoding="utf-8")
