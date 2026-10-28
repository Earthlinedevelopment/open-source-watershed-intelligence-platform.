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
    /* EARTHLINE_REGIONAL_OPPORTUNITY_VISIBLE_17604
       Regional mode must show general swale opportunity geometry at the watershed view.
       Focus remains visible; Property remains owned exclusively by authoritative safe lines. */
    if(tier==='regional'||tier==='focus')return true;
    return false;
  }"""
if s.count(old)!=1:
    raise SystemExit(f"regional visibility owner count {s.count(old)}")
s=s.replace(old,new,1)
s=s.replace("<!-- EARTHLINE_REGIONAL_CLEAN_PRESENTATION_17434: initial Regional shows water/aquifer context + corridor tabs; corridor worms render only after zoom-in. -->",
            "<!-- EARTHLINE_REGIONAL_OPPORTUNITY_VISIBLE_17604: Regional watershed view shows general swale opportunity geometry with water/aquifer context. -->",1)
p.write_text(s,encoding="utf-8")
print("installed Regional opportunity visibility owner 17604")
