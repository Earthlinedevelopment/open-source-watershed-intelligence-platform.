from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name,old,new):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

# 1) Shared principal-landmass analysis extent for grossly inflated multipart state bboxes.
anchor="""  function earthlineStateZoomHint16556(bbox16556){
    const span16556=Math.max(Math.abs(Number(bbox16556[2])-Number(bbox16556[0])),Math.abs(Number(bbox16556[3])-Number(bbox16556[1])));
    return span16556>20?3.8:span16556>12?4.4:span16556>7?5.0:span16556>4?5.7:span16556>2.5?6.3:6.8;
  }
"""
insert=anchor+"""  function earthlineRegionalAnalysisBounds16712(g16712,rawBBox16712){
    const fallback16712=Array.isArray(rawBBox16712)?rawBBox16712.map(Number):null;
    const prepared16712=earthlinePrepareJurisdiction16539(g16712);
    const rows16712=[];
    for(const poly16712 of (prepared16712&&prepared16712.polygons||[])){
      const b16712=poly16712&&poly16712.bbox;if(!b16712)continue;
      const rawLon16712=Math.max(0,Number(b16712[2])-Number(b16712[0])),latSpan16712=Math.max(0,Number(b16712[3])-Number(b16712[1]));
      const lonSpan16712=rawLon16712>180?360-rawLon16712:rawLon16712,midLat16712=(Number(b16712[1])+Number(b16712[3]))/2;
      const area16712=Math.max(0,lonSpan16712*latSpan16712*Math.max(.05,Math.cos(midLat16712*Math.PI/180)));
      rows16712.push({bbox:b16712.map(Number),rawLon:rawLon16712,area:area16712});
    }
    if(!fallback16712||fallback16712.some(v=>!Number.isFinite(v))||!rows16712.length)return {bbox:fallback16712,trimmed:false,reason:'fallback'};
    const maxArea16712=Math.max(...rows16712.map(r=>r.area)),kept16712=rows16712.filter(r=>r.area>=maxArea16712*.02&&r.rawLon<=180);
    if(!kept16712.length)return {bbox:fallback16712,trimmed:false,reason:'no-significant-components'};
    const robust16712=[
      Math.min(...kept16712.map(r=>r.bbox[0])),
      Math.min(...kept16712.map(r=>r.bbox[1])),
      Math.max(...kept16712.map(r=>r.bbox[2])),
      Math.max(...kept16712.map(r=>r.bbox[3]))
    ];
    const rawLon16712=Math.max(.0001,fallback16712[2]-fallback16712[0]),rawLat16712=Math.max(.0001,fallback16712[3]-fallback16712[1]),
          robustLon16712=Math.max(.0001,robust16712[2]-robust16712[0]),robustLat16712=Math.max(.0001,robust16712[3]-robust16712[1]);
    const inflated16712=(rawLon16712/robustLon16712>=1.35)||(rawLat16712/robustLat16712>=1.35);
    return {bbox:(inflated16712?robust16712:fallback16712),trimmed:inflated16712,rawBBox:fallback16712,robustBBox:robust16712,componentCount:rows16712.length,keptComponents:kept16712.length,largestComponentAreaProxy:maxArea16712,rule:'use significant land components only when remote multipart geometry inflates the statewide analysis envelope by >=35%'};
  }
"""
patch("analysis-extent-function",anchor,insert)

old="""    const bbox16556=rawBBox16556.map(Number),center16556=rawCenter16556.map(Number);
    if(bbox16556.some(v16556=>!Number.isFinite(v16556))||center16556.some(v16556=>!Number.isFinite(v16556)))
      throw new Error('atomic state package contains non-finite extent data');"""
new="""    const extentAudit16712=earthlineRegionalAnalysisBounds16712(boundary16556.geometry,rawBBox16556);
    const bbox16556=(extentAudit16712&&Array.isArray(extentAudit16712.bbox)?extentAudit16712.bbox:rawBBox16556).map(Number),center16556=rawCenter16556.map(Number);
    window.EARTHLINE_REGIONAL_ANALYSIS_EXTENT_16712=Object.assign({profileId:profile16556.id,query:profile16556.query,at:new Date().toISOString()},extentAudit16712||{});
    if(bbox16556.some(v16556=>!Number.isFinite(v16556))||center16556.some(v16556=>!Number.isFinite(v16556)))
      throw new Error('atomic state package contains non-finite extent data');"""
patch("analysis-extent-application",old,new)

# 2) Restore the already-proven regional renderer rule: valid local corridors may be short on a statewide screen.
old="""      const pts=points(f.geometry.coordinates),len=polyLength(pts);if(pts.length<3||len<22)continue;
      const props=f.properties||{},grade=/^[ABC]$/.test(String(props.grade||''))?String(props.grade):'C';
      const rank=(gradeCounts[grade]||0)+1,score=Math.max(0,Math.min(100,Number(props.score||0)));props.display_rank=rank;props.display_code=grade+rank;
      const main=grade==='A'?'#42ff83':grade==='B'?'#ffc12f':'#ff8a2d';
      const light=grade==='A'?'#e1ffeb':grade==='B'?'#fff2b0':'#ffe0bd';
      const activeTier=activeTier16168();"""
new="""      const pts=points(f.geometry.coordinates),len=polyLength(pts),activeTier=activeTier16168();
      if(pts.length<3||len<(activeTier==='focus'?22:1.5))continue;
      const props=f.properties||{},grade=/^[ABC]$/.test(String(props.grade||''))?String(props.grade):'C';
      const rank=(gradeCounts[grade]||0)+1,score=Math.max(0,Math.min(100,Number(props.score||0)));props.display_rank=rank;props.display_code=grade+rank;
      const main=grade==='A'?'#42ff83':grade==='B'?'#ffc12f':'#ff8a2d';
      const light=grade==='A'?'#e1ffeb':grade==='B'?'#fff2b0':'#ffe0bd';"""
patch("regional-render-threshold",old,new)

p.write_text(s,encoding="utf-8")
print("16712 applied: robust multipart analysis extent + regional renderer threshold")
