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
    if(tier==='property')return false;
    /* EARTHLINE M81 — Regional swale geometry is part of the default published
       screening result. Do not hide it behind an extra +0.85 zoom step. */
    return true;
  }"""
if old not in s:
    raise SystemExit("regional visibility owner not found")
p.write_text(s.replace(old,new,1),encoding="utf-8")
