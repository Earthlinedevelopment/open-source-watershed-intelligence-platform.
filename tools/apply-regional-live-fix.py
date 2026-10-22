from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")
a="const reserveBudget16775=Math.min(regionalCapacity16755,totalSubs16775);"
b="const reserveBudget16775=Math.min(regionalCapacity16755,totalSubs16775,coverageGroups16736.size*3);"
if s.count(a)!=1: raise SystemExit("balance anchor")
s=s.replace(a,b,1)
a="""  function corridorGeometryVisible17434(map){
    const tier=activeTier16168();
    if(tier==='focus')return true;
    if(tier==='property')return false;
    const published=window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337||null;
    const publishedZoom=Number(published&&published.zoom),currentZoom=Number(map?.getZoom?.());
    if(!Number.isFinite(currentZoom))return false;
    if(!Number.isFinite(publishedZoom))return false;
    return currentZoom>=publishedZoom+0.85;
  }"""
b="""  function corridorGeometryVisible17434(map){
    const tier=activeTier16168();
    if(tier==='focus'||tier==='regional')return true;
    if(tier==='property')return false;
    return false;
  }"""
if s.count(a)!=1: raise SystemExit("visibility anchor")
s=s.replace(a,b,1)
p.write_text(s)
print("REGIONAL_FIX_OK")
