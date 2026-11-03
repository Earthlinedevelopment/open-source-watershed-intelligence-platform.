from pathlib import Path
import hashlib
p=Path('index.html')
s=p.read_text(encoding='utf-8')
prior=hashlib.sha256(s.encode()).hexdigest()
assert prior=='ff33f3297511f6111b1b58122179e0bf4a8e76706c3c67315360ab4234d7cbca',f'Unexpected production parent: {prior}'
edits=[
 ("""    water:'earthline-property-safe-water-16221'
  };""",
  """    water:'earthline-property-safe-water-16221',
    waterSecond:'earthline-property-safe-water-second-m96'
  };""",1),
 ("""      {id:SAFE_LAYERS_16221.water,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#4ec9ff','line-opacity':.98,'line-width':['interpolate',['linear'],['zoom'],14,3.90625,17,8.203125,20,12.5],'line-offset':['interpolate',['linear'],['zoom'],14,1.2,17,2.5,20,3.8]}}""",
  """      /* M96: two individually visible dotted blue strips on the SAME safety-vetted
         Property geometry. This is presentation only: no new screening segments. */
      {id:SAFE_LAYERS_16221.water,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#12c8ff','line-opacity':1,'line-width':['interpolate',['linear'],['zoom'],14,3.5,17,5.8,20,8.5],'line-offset':['interpolate',['linear'],['zoom'],14,2.8,17,6.4,20,9.5],'line-dasharray':[.72,.68]}},
      {id:SAFE_LAYERS_16221.waterSecond,type:'line',source:SAFE_SOURCE_16221,layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#12c8ff','line-opacity':1,'line-width':['interpolate',['linear'],['zoom'],14,3.5,17,5.8,20,8.5],'line-offset':['interpolate',['linear'],['zoom'],14,-2.8,17,-6.4,20,-9.5],'line-dasharray':[.72,.68]}}""",1),
 ("""'earthline-property-safe-water-16221']){try{if(mp.getLayer?.(id))mp.setPaintProperty(id,'line-opacity',0)}""",
  """'earthline-property-safe-water-16221','earthline-property-safe-water-second-m96']){try{if(mp.getLayer?.(id))mp.setPaintProperty(id,'line-opacity',0)}""",1),
 ("""'earthline-property-safe-water-16221']){try{if(mp.getLayer?.(id))mp.setPaintProperty(id,'line-opacity',.98)}""",
  """'earthline-property-safe-water-16221','earthline-property-safe-water-second-m96']){try{if(mp.getLayer?.(id))mp.setPaintProperty(id,'line-opacity',.98)}""",1)
]
for old,new,num in edits:
  count=s.count(old)
  assert count==num,f'M96 exact edit point missing or duplicated: {count} {old[:110]}'
  s=s.replace(old,new,1)
assert s.count('SAFE_LAYERS_16221.waterSecond')==1
assert s.count('earthline-property-safe-water-second-m96')==3
p.write_text(s,encoding='utf-8')
print('M96_SAFE_PROPERTY_VISUAL_PATCH',hashlib.sha256(s.encode()).hexdigest())
