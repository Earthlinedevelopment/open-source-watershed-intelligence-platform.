from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old1="            lengthM:h.pathMetrics&&h.pathMetrics.lengthM||0,\n            constructionReady:false,"
new1="            lengthM:h.pathMetrics&&h.pathMetrics.lengthM||0,\n            anchorLng:Number(h.lng),anchorLat:Number(h.lat),\n            constructionReady:false,"
n=s.count(old1)
if n!=1:
    raise SystemExit(f"expected one regional opportunity property block, found {n}")
s=s.replace(old1,new1,1)
old2="const p=f.properties||{},ll=coords[Math.floor((coords.length-1)/2)],code=String(p.display_code||p.label||((/^[ABC]$/.test(String(p.grade||''))?String(p.grade):'C')+String(Number(p.display_rank||p.rank||Number(index||0)+1)||Number(index||0)+1)));setTimeout(()=>setPropertyTarget16201({lng:Number(ll[0]),lat:Number(ll[1]),source:'corridor',code,score:Number(p.score||0)},{scroll:true,openPanel:false}),0)"
new2="const p=f.properties||{},ll=coords[Math.floor((coords.length-1)/2)],anchorLng=Number(p.anchorLng),anchorLat=Number(p.anchorLat),targetLng=Number.isFinite(anchorLng)?anchorLng:Number(ll[0]),targetLat=Number.isFinite(anchorLat)?anchorLat:Number(ll[1]),code=String(p.display_code||p.label||((/^[ABC]$/.test(String(p.grade||''))?String(p.grade):'C')+String(Number(p.display_rank||p.rank||Number(index||0)+1)||Number(index||0)+1)));setTimeout(()=>setPropertyTarget16201({lng:targetLng,lat:targetLat,source:'corridor-hotspot',code,score:Number(p.score||0)},{scroll:true,openPanel:false}),0)"
n=s.count(old2)
if n!=1:
    raise SystemExit(f"expected one corridor midpoint target owner, found {n}")
s=s.replace(old2,new2,1)
p.write_text(s,encoding="utf-8")
