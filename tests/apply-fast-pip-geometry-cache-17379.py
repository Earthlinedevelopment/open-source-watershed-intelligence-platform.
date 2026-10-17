from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    const jurisdictionFastPipIndex17378=(()=>{
      if(!jurisdictionFastGeometry17373)return null;
      const prepared17378=earthlinePrepareJurisdiction16539(jurisdictionFastGeometry17373);"""
new="""    const jurisdictionFastPipCache17379=window.__EARTHLINE_FAST_PIP_CACHE_17379||(window.__EARTHLINE_FAST_PIP_CACHE_17379=new WeakMap());
    const jurisdictionFastPipIndex17378=(()=>{
      if(!jurisdictionFastGeometry17373)return null;
      const cached17379=jurisdictionFastPipCache17379.get(jurisdictionFastGeometry17373);
      if(cached17379)return cached17379;
      const prepared17378=earthlinePrepareJurisdiction16539(jurisdictionFastGeometry17373);"""
if s.count(old)!=1: raise SystemExit("fast PIP build anchor missing")
s=s.replace(old,new,1)
old="""      return {scale:scale17378,polygons:polygons17378};
    })();"""
new="""      const built17379={scale:scale17378,polygons:polygons17378};
      jurisdictionFastPipCache17379.set(jurisdictionFastGeometry17373,built17379);
      return built17379;
    })();"""
if s.count(old)!=1: raise SystemExit("fast PIP return anchor missing")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_FAST_PIP_GEOMETRY_CACHE_17379: one exact row-index build per jurisdiction geometry; containment math unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed fast PIP geometry cache 17379")
