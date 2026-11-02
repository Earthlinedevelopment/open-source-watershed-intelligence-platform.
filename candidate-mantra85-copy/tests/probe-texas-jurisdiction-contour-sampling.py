from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="""    const lines=(contours&&contours.features||[]).filter(f=>f&&f.properties&&f.properties.feature_type==='contour'&&f.geometry&&f.geometry.type==='LineString');
"""
new="""    const sourceLines16592=(contours&&contours.features||[]).filter(f=>f&&f.properties&&f.properties.feature_type==='contour'&&f.geometry&&f.geometry.type==='LineString');
    const lines=[];
    if(!focusMode&&jurisdictionGeometry16539){
      for(const sourceLine16592 of sourceLines16592){
        const runs16592=earthlineClipLine16539(sourceLine16592.geometry.coordinates||[],jurisdictionGeometry16539);
        for(const run16592 of runs16592){
          if(!run16592||run16592.length<10||lineLengthPixels(hy,run16592)<5)continue;
          lines.push({type:'Feature',properties:sourceLine16592.properties||{},geometry:{type:'LineString',coordinates:run16592}});
        }
      }
    }else lines.push(...sourceLines16592);
"""
count=s.count(old)
if count!=1: raise SystemExit(f'expected contour line source once, found {count}')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('local probe variant: candidate sampling uses in-jurisdiction contour runs; full DEM contours/hydrology unchanged')
