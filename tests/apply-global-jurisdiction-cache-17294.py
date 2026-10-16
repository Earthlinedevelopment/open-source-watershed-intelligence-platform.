from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""  function earthlinePrepareJurisdiction16539(g){
    if(!g)return null;if(g.prepared16539===true)return g;
    const rawPolys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];
    const polygons=[];for(const rings of rawPolys){if(!Array.isArray(rings)||!rings.length)continue;const outer=rings[0],bbox=earthlineRingBounds16539(outer);if(!bbox)continue;const holes=[];for(let i=1;i<rings.length;i++){const hb=earthlineRingBounds16539(rings[i]);if(hb)holes.push({ring:rings[i],bbox:hb});}polygons.push({outer,bbox,holes});}
    return {prepared16539:true,polygons};
  }"""
new="""  const earthlinePreparedJurisdictionCache17294=new WeakMap();
  function earthlinePrepareJurisdiction16539(g){
    if(!g)return null;if(g.prepared16539===true)return g;
    if((typeof g==='object'||typeof g==='function')&&earthlinePreparedJurisdictionCache17294.has(g))return earthlinePreparedJurisdictionCache17294.get(g);
    const rawPolys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];
    const polygons=[];for(const rings of rawPolys){if(!Array.isArray(rings)||!rings.length)continue;const outer=rings[0],bbox=earthlineRingBounds16539(outer);if(!bbox)continue;const holes=[];for(let i=1;i<rings.length;i++){const hb=earthlineRingBounds16539(rings[i]);if(hb)holes.push({ring:rings[i],bbox:hb});}polygons.push({outer,bbox,holes});}
    const prepared17294={prepared16539:true,polygons};
    if(typeof g==='object'||typeof g==='function')earthlinePreparedJurisdictionCache17294.set(g,prepared17294);
    return prepared17294;
  }"""
if s.count(old)!=1: raise SystemExit(f"anchor count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("cached prepared jurisdiction geometry by object identity 17294")
