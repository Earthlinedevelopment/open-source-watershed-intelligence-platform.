from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")
old="""function corridorGeometryVisible17434(map){
    const tier=activeTier16168();
    if(tier==='focus'||tier==='regional')return true;
    if(tier==='property')return false;
    return false;
  }"""
new="""function corridorGeometryVisible17434(map){
    const tier=activeTier16168();
    if(tier==='focus')return true;
    if(tier==='property')return false;
    const published=window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337||null;
    const publishedZoom=Number(published&&published.zoom),currentZoom=Number(map?.getZoom?.());
    if(!Number.isFinite(currentZoom))return false;
    if(!Number.isFinite(publishedZoom))return false;
    return currentZoom>=publishedZoom+0.85;
  }"""
n=s.count(old)
if n!=1: raise SystemExit(f"17434 target count {n}, expected 1")
s=s.replace(old,new,1)
p.write_text(s)
print("EARTHLINE_17434_REGIONAL_WORM_GATE_RESTORED")
