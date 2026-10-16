from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""  function earthlinePrepareJurisdiction16539(g){
    if(!g)return null;if(g.prepared16539===true)return g;
    const rawPolys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];
    const polygons=[];for(const rings of rawPolys){if(!Array.isArray(rings)||!rings.length)continue;const outer=rings[0],bbox=earthlineRingBounds16539(outer);if(!bbox)continue;const holes=[];for(let i=1;i<rings.length;i++){const hb=earthlineRingBounds16539(rings[i]);if(hb)holes.push({ring:rings[i],bbox:hb});}polygons.push({outer,bbox,holes});}
    return {prepared16539:true,polygons};
  }"""

new="""  const earthlinePreparedJurisdictionCache17269=new WeakMap();
  function earthlinePrepareJurisdiction16539(g){
    if(!g)return null;if(g.prepared16539===true)return g;
    const cacheable17269=(typeof g==='object'&&g!==null);
    if(cacheable17269){const cached17269=earthlinePreparedJurisdictionCache17269.get(g);if(cached17269)return cached17269;}
    const rawPolys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];
    const polygons=[];for(const rings of rawPolys){if(!Array.isArray(rings)||!rings.length)continue;const outer=rings[0],bbox=earthlineRingBounds16539(outer);if(!bbox)continue;const holes=[];for(let i=1;i<rings.length;i++){const hb=earthlineRingBounds16539(rings[i]);if(hb)holes.push({ring:rings[i],bbox:hb});}polygons.push({outer,bbox,holes});}
    const prepared17269={prepared16539:true,polygons};
    if(cacheable17269)earthlinePreparedJurisdictionCache17269.set(g,prepared17269);
    return prepared17269;
  }"""

n=s.count(old)
print("prepare anchors",n)
if n!=1: raise SystemExit("expected exactly one jurisdiction prepare anchor")
s=s.replace(old,new,1)
s="/* EARTHLINE_PREPARED_JURISDICTION_CACHE_17269 — exact boundary preparation memoized by raw geometry identity; clipping and science unchanged. */\n"+s
p.write_text(s,encoding="utf-8")
print("17269 prepared-jurisdiction cache applied")
