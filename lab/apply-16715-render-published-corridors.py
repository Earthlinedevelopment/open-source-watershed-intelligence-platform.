from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    const gradeCounts={A:0,B:0,C:0},gradeLabels=[];
    for(const f of (lastData.swales&&lastData.swales.features||[])){
      if(!f.geometry||f.geometry.type!=='LineString')continue;
      const pts=points(f.geometry.coordinates),len=polyLength(pts);if(pts.length<3||len<22)continue;"""
new="""    const gradeCounts={A:0,B:0,C:0},gradeLabels=[];
    for(const f of (lastData.swales&&lastData.swales.features||[])){
      if(!f.geometry||f.geometry.type!=='LineString')continue;
      const pts=points(f.geometry.coordinates),len=polyLength(pts);if(pts.length<3||len<4)continue;"""
n=s.count(old)
if n!=1: raise SystemExit(f"renderer anchor expected once, found {n}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("16715 renderer threshold aligned with regional generation minimum")
