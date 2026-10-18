from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old_flag="""    const isRegionalTile15769=!!(
      M.loc && (
        /Regional Opportunity Tile/i.test(String(M.loc.name||"")) ||
        (Array.isArray(M.loc.zones)&&M.loc.zones.includes("Regional Tile"))
      )
    );
    const work15771=isRegionalTile15769"""
new_flag="""    const isRegionalTile15769=!!(
      M.loc && (
        /Regional Opportunity Tile/i.test(String(M.loc.name||"")) ||
        (Array.isArray(M.loc.zones)&&M.loc.zones.includes("Regional Tile"))
      )
    );
    /* EARTHLINE 17485 — authoritative run-scoped scale owner for channel buffer.
       The prescriber itself owns Property vs Regional truth; downstream channel
       geometry reads this flag instead of UI/lifecycle heuristics. */
    M.earthlinePropertyChannelBuffer17485=!isRegionalTile15769;
    const work15771=isRegionalTile15769"""
if s.count(old_flag)!=1: raise SystemExit(f"prescriber scale anchor {s.count(old_flag)}")
s=s.replace(old_flag,new_flag,1)
old_a="""          const propertyExact17483=String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running'||
            !!(M&&M.loc&&M.loc.userSelectedSite===true&&Number(M.loc.acres||0)>0&&Number(M.loc.acres||0)<=50);
          if(propertyExact17483&&Math.hypot(ox,oy)*Math.max(0.5,Number(M.cellM||1))>4.000001)continue;"""
new_a="""          const propertyExact17485=!!(M&&M.earthlinePropertyChannelBuffer17485===true);
          if(propertyExact17485&&Math.hypot(ox,oy)*Math.max(0.5,Number(M.cellM||1))>4.000001)continue;"""
if s.count(old_a)!=1: raise SystemExit(f"channel cache predicate anchor {s.count(old_a)}")
s=s.replace(old_a,new_a,1)
old_b="""    const propertyExact17483=String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running'||
      !!(M&&M.loc&&M.loc.userSelectedSite===true&&Number(M.loc.acres||0)>0&&Number(M.loc.acres||0)<=50);
    if(propertyExact17483&&Math.hypot(ox,oy)*Math.max(0.5,Number(M.cellM||1))>4.000001)continue;"""
new_b="""    const propertyExact17485=!!(M&&M.earthlinePropertyChannelBuffer17485===true);
    if(propertyExact17485&&Math.hypot(ox,oy)*Math.max(0.5,Number(M.cellM||1))>4.000001)continue;"""
if s.count(old_b)!=1: raise SystemExit(f"path predicate anchor {s.count(old_b)}")
s=s.replace(old_b,new_b,1)
s="<!-- EARTHLINE_PROPERTY_CHANNEL_RUN_SCOPE_17485: authoritative prescriber scale flag owns Property-only exact 4 m channel buffer. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed authoritative Property channel scope 17485")
