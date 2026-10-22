from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")

old_budget="""    const work15771=isRegionalTile15769
      ? {maxLevels:16,maxSeedsPerLevel:4,maxCandidates:16,maxFinal:10,perLevel:2,maxMs:2000}
      : {maxLevels:72,maxSeedsPerLevel:16,maxCandidates:256,maxFinal:200,perLevel:16,maxMs:120000};"""
new_budget="""    const work15771=isRegionalTile15769
      ? {maxLevels:14,maxSeedsPerLevel:4,maxCandidates:10,maxFinal:6,perLevel:1,maxMs:2000}
      : {maxLevels:72,maxSeedsPerLevel:16,maxCandidates:256,maxFinal:200,perLevel:16,maxMs:120000};"""
if s.count(old_budget)!=1: raise SystemExit(f"regional budget refinement count {s.count(old_budget)}")
s=s.replace(old_budget,new_budget,1)

old_seed="const effectiveSeedBudget15841=work15771.maxSeedsPerLevel;"
new_seed="const effectiveSeedBudget15841=isRegionalTile15769?2:work15771.maxSeedsPerLevel;"
if s.count(old_seed)!=1: raise SystemExit(f"regional seed refinement count {s.count(old_seed)}")
s=s.replace(old_seed,new_seed,1)

old_balance="const reserveBudget16775=Math.min(regionalCapacity16755,totalSubs16775);"
new_balance="const reserveBudget16775=Math.min(regionalCapacity16755,totalSubs16775,coverageGroups16736.size*3);"
if s.count(old_balance)!=1: raise SystemExit(f"regional balance anchor count {s.count(old_balance)}")
s=s.replace(old_balance,new_balance,1)

old_vis="""  function corridorGeometryVisible17434(map){
    const tier=activeTier16168();
    if(tier==='focus')return true;
    if(tier==='property')return false;
    const published=window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337||null;
    const publishedZoom=Number(published&&published.zoom),currentZoom=Number(map?.getZoom?.());
    if(!Number.isFinite(currentZoom))return false;
    if(!Number.isFinite(publishedZoom))return false;
    return currentZoom>=publishedZoom+0.85;
  }"""
new_vis="""  function corridorGeometryVisible17434(map){
    const tier=activeTier16168();
    if(tier==='focus'||tier==='regional')return true;
    if(tier==='property')return false;
    return false;
  }"""
if s.count(old_vis)!=1: raise SystemExit(f"regional visibility anchor count {s.count(old_vis)}")
s=s.replace(old_vis,new_vis,1)

p.write_text(s)
print("EARTHLINE_M75_ENGINE_REFINED")
