from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='''    const targetZoom=propertyTarget
      ?Math.max(17,Number(loc.zoomHint||17))
      :Math.max(9,Number(loc.zoomHint||12));'''
new='''    let targetCenter=[Number(loc.lng),Number(loc.lat)];
    let targetZoom=propertyTarget?Math.max(17,Number(loc.zoomHint||17)):Math.max(9,Number(loc.zoomHint||12));
    if(!propertyTarget&&Array.isArray(loc.bbox)&&loc.bbox.length===4&&earthlineMap&&typeof earthlineMap.cameraForBounds==="function"){
      try{
        const cam=earthlineMap.cameraForBounds([[Number(loc.bbox[0]),Number(loc.bbox[1])],[Number(loc.bbox[2]),Number(loc.bbox[3])]],{padding:72,maxZoom:11});
        if(cam&&Number.isFinite(Number(cam.zoom)))targetZoom=Math.max(0,Math.min(11,Number(cam.zoom)));
        if(cam&&cam.center&&Number.isFinite(Number(cam.center.lng))&&Number.isFinite(Number(cam.center.lat)))targetCenter=[Number(cam.center.lng),Number(cam.center.lat)];
        else targetCenter=[(Number(loc.bbox[0])+Number(loc.bbox[2]))/2,(Number(loc.bbox[1])+Number(loc.bbox[3]))/2];
      }catch(_){targetCenter=[(Number(loc.bbox[0])+Number(loc.bbox[2]))/2,(Number(loc.bbox[1])+Number(loc.bbox[3]))/2];}
    }'''
if s.count(old)!=1: raise SystemExit(f'targetZoom anchor count={s.count(old)}')
s=s.replace(old,new,1)
old2='''          center:[Number(loc.lng),Number(loc.lat)],
          zoom:targetZoom,bearing:0,pitch:0,'''
new2='''          center:targetCenter,
          zoom:targetZoom,bearing:0,pitch:0,'''
if s.count(old2)!=1: raise SystemExit(f'jump center anchor count={s.count(old2)}')
s=s.replace(old2,new2,1)
p.write_text(s,encoding='utf-8')
print('NZ bbox camera patch applied')
