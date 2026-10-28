from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    const specs=[
      {id:SAFE_LAYERS_16221.casing,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#123d24','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,10,17,20,20,30]}},
      {id:SAFE_LAYERS_16221.earth,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#7a5738','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,7,17,15,20,23]}},
      {id:SAFE_LAYERS_16221.life,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#56a862','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,4.5,17,9,20,14],'line-offset':['interpolate',['linear'],['zoom'],14,-1.5,17,-3.2,20,-4.8],'line-dasharray':[.7,.38]}},
      {id:SAFE_LAYERS_16221.water,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#4ec9ff','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,3.90625,17,8.203125,20,12.5],'line-offset':['interpolate',['linear'],['zoom'],14,1.2,17,2.5,20,3.8]}}
    ];"""
new="""    /* EARTHLINE_AUTHORITATIVE_BLUE_SWALE_STYLE_17610
       Presentation only. Geometry and every scientific acceptance gate remain unchanged.
       Two offset dotted blue strips are the visible bioswale identity. */
    const specs=[
      {id:SAFE_LAYERS_16221.casing,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#0b3655','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,10,17,20,20,30]}},
      {id:SAFE_LAYERS_16221.earth,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#176b9a','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,7,17,15,20,23]}},
      {id:SAFE_LAYERS_16221.life,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#5bd4ff','line-opacity':1,'line-width':['interpolate',['linear'],['zoom'],14,4.8,17,9.4,20,14.4],'line-offset':['interpolate',['linear'],['zoom'],14,-1.7,17,-3.5,20,-5.2],'line-dasharray':[.72,.42]}},
      {id:SAFE_LAYERS_16221.water,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#159de0','line-opacity':1,'line-width':['interpolate',['linear'],['zoom'],14,4.8,17,9.4,20,14.4],'line-offset':['interpolate',['linear'],['zoom'],14,1.7,17,3.5,20,5.2],'line-dasharray':[.72,.42]}}
    ];"""
if s.count(old)!=1:
    raise SystemExit(f"safe-line owner count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("authoritative blue swale style 17610 installed")
