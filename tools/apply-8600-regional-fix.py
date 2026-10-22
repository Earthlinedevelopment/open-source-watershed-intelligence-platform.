from pathlib import Path
import sys
p=Path(sys.argv[1])
s=p.read_text(errors="strict")
old="const reserveBudget16775=Math.min(regionalCapacity16755,totalSubs16775);"
new="const reserveBudget16775=Math.min(regionalCapacity16755,totalSubs16775,coverageGroups16736.size*3);"
if s.count(old)!=1: raise SystemExit(f"balance anchor count {s.count(old)}")
s=s.replace(old,new,1)
old2="""  function corridorGeometryVisible17434(map){
    const tier=activeTier16168();
    if(tier==='focus')return true;
    if(tier==='property')return false;
    const published=window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337||null;
    const publishedZoom=Number(published&&published.zoom),currentZoom=Number(map?.getZoom?.());
    if(!Number.isFinite(currentZoom))return false;
    if(!Number.isFinite(publishedZoom))return false;
    return currentZoom>=publishedZoom+0.85;
  }"""
new2="""  function corridorGeometryVisible17434(map){
    const tier=activeTier16168();
    if(tier==='focus'||tier==='regional')return true;
    if(tier==='property')return false;
    return false;
  }"""
if s.count(old2)!=1: raise SystemExit(f"visibility anchor count {s.count(old2)}")
s=s.replace(old2,new2,1)
p.write_text(s)
print("EARTHLINE_8600_REGIONAL_FIX_APPLIED")
