from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""  function corridorGeometryVisible17434(map){
    const tier=activeTier16168();
    if(tier==='focus')return true;
    if(tier==='property')return false;
    const published=window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337||null;
    const publishedZoom=Number(published&&published.zoom),currentZoom=Number(map?.getZoom?.());
    if(!Number.isFinite(currentZoom))return false;
    if(!Number.isFinite(publishedZoom))return false;
    return currentZoom>=publishedZoom+0.85;
  }"""
new="""  function corridorGeometryVisible17434(map){
    const tier=activeTier16168();
    if(tier==='focus'||tier==='regional')return true;
    if(tier==='property')return false;
    return false;
  }"""
if s.count(old)!=1:
    raise SystemExit(f"EARTHLINE 17704 anchor count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("EARTHLINE_17704_REGIONAL_CORRIDORS_VISIBLE_APPLIED")
