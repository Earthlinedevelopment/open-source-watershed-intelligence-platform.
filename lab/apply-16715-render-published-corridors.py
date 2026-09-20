from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""      const pts=points(f.geometry.coordinates),len=polyLength(pts),activeTier=activeTier16168();
      if(pts.length<3||len<(activeTier==='focus'?22:1.5))continue;"""
new="""      const pts=points(f.geometry.coordinates),len=polyLength(pts),activeTier=activeTier16168();
      if(activeTier==='focus'?(pts.length<3||len<22):(pts.length<2||len<0.1))continue;"""
n=s.count(old)
if n!=1: raise SystemExit(f"renderer anchor expected once, found {n}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("16715 regional renderer accepts every valid non-collapsed published LineString")
