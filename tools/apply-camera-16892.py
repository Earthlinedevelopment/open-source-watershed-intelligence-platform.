from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="""    const targetZoom=propertyTarget
      ?Math.max(17,Number(loc.zoomHint||17))
      :Math.max(9,Number(loc.zoomHint||12));

    /* BUILD-CHECK-15801 — write location identity and coordinates together. */"""
new="""    let targetZoom=propertyTarget
      ?Math.max(17,Number(loc.zoomHint||17))
      :Math.max(9,Number(loc.zoomHint||12));
    let searchCameraCenter15801={lng:Number(loc.lng),lat:Number(loc.lat)};
    /* EARTHLINE 16892 — camera-only large-area framing repair. Science bbox,
       terrain, hydrology, ranking, land validity, exclusions and publication
       rules remain unchanged. */
    if(!propertyTarget&&earthlineMap&&typeof earthlineMap.cameraForBounds==='function'&&Array.isArray(loc.bbox)&&loc.bbox.length===4){
      try{
        const b=loc.bbox.map(Number);
        if(b.every(Number.isFinite)){
          const cam=earthlineMap.cameraForBounds([[b[0],b[1]],[b[2],b[3]]],{padding:72,maxZoom:11});
          if(cam&&Number.isFinite(Number(cam.zoom)))targetZoom=Math.max(0,Math.min(11,Number(cam.zoom)));
          if(cam&&cam.center&&Number.isFinite(Number(cam.center.lng))&&Number.isFinite(Number(cam.center.lat)))searchCameraCenter15801={lng:Number(cam.center.lng),lat:Number(cam.center.lat)};
        }
      }catch(_){}
    }

    /* BUILD-CHECK-15801 — write location identity and coordinates together. */"""
if old not in s: raise SystemExit('targetZoom owner anchor not found')
s=s.replace(old,new)
old2="""          center:[Number(loc.lng),Number(loc.lat)],
          zoom:targetZoom,bearing:0,pitch:0,"""
new2="""          center:[Number(searchCameraCenter15801.lng),Number(searchCameraCenter15801.lat)],
          zoom:targetZoom,bearing:0,pitch:0,"""
if old2 not in s: raise SystemExit('immediate camera anchor not found')
s=s.replace(old2,new2)
p.write_text(s,encoding='utf-8')
print('camera 16892 patch applied')
