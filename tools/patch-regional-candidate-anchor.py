from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
repls=[
("""const accepted17373=Object.assign({},candidate16539,{
          segment:sourceSegment17373,""",
 """const accepted17373=Object.assign({},candidate16539,{
          propertyAnchorX16539:Number(candidate16539.x),propertyAnchorY16539:Number(candidate16539.y),
          segment:sourceSegment17373,"""),
("""const screenedCandidate16592=Object.assign({},candidate16539,{
        segment:segment16539,""",
 """const screenedCandidate16592=Object.assign({},candidate16539,{
        propertyAnchorX16539:Number(candidate16539.x),propertyAnchorY16539:Number(candidate16539.y),
        segment:segment16539,"""),
("""      const slopeFit=Math.max(0,Math.min(100,Math.round(100-Math.abs(c.slope-3.4)*9)));
      const relief=Number(c.contourAudit16166.reliefM),drop=Number(c.contourAudit16166.endDropM);
      features.push({type:'Feature',properties:{""",
 """      const slopeFit=Math.max(0,Math.min(100,Math.round(100-Math.abs(c.slope-3.4)*9)));
      const relief=Number(c.contourAudit16166.reliefM),drop=Number(c.contourAudit16166.endDropM);
      const pax16167=Number.isFinite(Number(c.propertyAnchorX16539))?Number(c.propertyAnchorX16539):Number(c.x);
      const pay16167=Number.isFinite(Number(c.propertyAnchorY16539))?Number(c.propertyAnchorY16539):Number(c.y);
      const pall16167=gridLL(hy,pax16167,pay16167);
      const anchorInside16167=!jurisdictionGeometry16539||earthlinePointInJurisdiction16539(pall16167,jurisdictionGeometry16539);
      const finalAnchor16167=anchorInside16167?pall16167:gridLL(hy,Number(c.x),Number(c.y));
      features.push({type:'Feature',properties:{"""),
("""        confidence:c.confidence,
        contour_valid:focusMode?true:null,""",
 """        confidence:c.confidence,
        property_anchor_lng:Number(finalAnchor16167&&finalAnchor16167[0]),
        property_anchor_lat:Number(finalAnchor16167&&finalAnchor16167[1]),
        contour_valid:focusMode?true:null,""")
]
for old,new in repls:
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"expected one token, found {n}: {old[:70]!r}")
    s=s.replace(old,new,1)
oldwrap="const p=f.properties||{},ll=coords[Math.floor((coords.length-1)/2)],code=String(p.display_code||p.label||((/^[ABC]$/.test(String(p.grade||''))?String(p.grade):'C')+String(Number(p.display_rank||p.rank||Number(index||0)+1)||Number(index||0)+1)));setTimeout(()=>setPropertyTarget16201({lng:Number(ll[0]),lat:Number(ll[1]),source:'corridor',code,score:Number(p.score||0)},{scroll:true,openPanel:false}),0)"
newwrap="const p=f.properties||{},ll=coords[Math.floor((coords.length-1)/2)],paLng=Number(p.property_anchor_lng),paLat=Number(p.property_anchor_lat),targetLng=Number.isFinite(paLng)?paLng:Number(ll[0]),targetLat=Number.isFinite(paLat)?paLat:Number(ll[1]),code=String(p.display_code||p.label||((/^[ABC]$/.test(String(p.grade||''))?String(p.grade):'C')+String(Number(p.display_rank||p.rank||Number(index||0)+1)||Number(index||0)+1)));setTimeout(()=>setPropertyTarget16201({lng:targetLng,lat:targetLat,source:'corridor-anchor',code,score:Number(p.score||0)},{scroll:true,openPanel:false}),0)"
n=s.count(oldwrap)
if n!=1:
    raise SystemExit(f"expected one corridor wrapper, found {n}")
s=s.replace(oldwrap,newwrap,1)
p.write_text(s,encoding="utf-8")
