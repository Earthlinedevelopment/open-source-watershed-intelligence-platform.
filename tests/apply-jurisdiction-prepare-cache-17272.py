from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""  function earthlinePrepareJurisdiction16539(g){
    if(!g)return null;if(g.prepared16539===true)return g;
    const rawPolys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];
    const polygons=[];for(const rings of rawPolys){if(!Array.isArray(rings)||!rings.length)continue;const outer=rings[0],bbox=earthlineRingBounds16539(outer);if(!bbox)continue;const holes=[];for(let i=1;i<rings.length;i++){const hb=earthlineRingBounds16539(rings[i]);if(hb)holes.push({ring:rings[i],bbox:hb});}polygons.push({outer,bbox,holes});}
    return {prepared16539:true,polygons};
  }"""
new="""  const earthlinePreparedJurisdictionCache17272=new WeakMap();
  function earthlinePrepareJurisdiction16539(g){
    if(!g)return null;if(g.prepared16539===true)return g;
    if((typeof g==='object'||typeof g==='function')&&earthlinePreparedJurisdictionCache17272.has(g))return earthlinePreparedJurisdictionCache17272.get(g);
    const rawPolys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];
    const polygons=[];for(const rings of rawPolys){if(!Array.isArray(rings)||!rings.length)continue;const outer=rings[0],bbox=earthlineRingBounds16539(outer);if(!bbox)continue;const holes=[];for(let i=1;i<rings.length;i++){const hb=earthlineRingBounds16539(rings[i]);if(hb)holes.push({ring:rings[i],bbox:hb});}polygons.push({outer,bbox,holes});}
    const prepared17272={prepared16539:true,polygons};
    if(typeof g==='object'||typeof g==='function')earthlinePreparedJurisdictionCache17272.set(g,prepared17272);
    return prepared17272;
  }"""
if s.count(old)!=1: raise SystemExit(f"prepare anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_JURISDICTION_PREP_CACHE_17272: immutable geometry preparation memoized by object identity; no science changes. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched jurisdiction preparation cache 17272")
