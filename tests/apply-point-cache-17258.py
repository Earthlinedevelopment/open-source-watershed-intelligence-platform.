from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""  function earthlinePointInJurisdiction16539(p,g){
    if(!g)return false;
    const prepared=earthlinePrepareJurisdiction16539(g);if(!prepared)return false;
    for(const poly of prepared.polygons||[]){if(!earthlineBBoxContains16539(poly.bbox,p)||!earthlinePointInRingIndexed16722(p,poly.outer))continue;let inHole=false;for(const h of poly.holes||[]){if(earthlineBBoxContains16539(h.bbox,p)&&earthlinePointInRingIndexed16722(p,h.ring)){inHole=true;break;}}if(!inHole)return true;}
    return false;
  }"""
new="""  const earthlineJurisdictionPointCache17258=new WeakMap();
  function earthlinePointInJurisdiction16539(p,g){
    if(!g)return false;
    const cacheable17258=(typeof g==='object'&&g!==null&&earthlineFinitePoint16539(p));
    let cache17258=null,key17258='';
    if(cacheable17258){
      cache17258=earthlineJurisdictionPointCache17258.get(g);
      if(!cache17258){cache17258=new Map();earthlineJurisdictionPointCache17258.set(g,cache17258);}
      key17258=String(Number(p[0]))+'|'+String(Number(p[1]));
      if(cache17258.has(key17258))return cache17258.get(key17258);
    }
    const prepared=earthlinePrepareJurisdiction16539(g);if(!prepared)return false;
    let result17258=false;
    for(const poly of prepared.polygons||[]){if(!earthlineBBoxContains16539(poly.bbox,p)||!earthlinePointInRingIndexed16722(p,poly.outer))continue;let inHole=false;for(const h of poly.holes||[]){if(earthlineBBoxContains16539(h.bbox,p)&&earthlinePointInRingIndexed16722(p,h.ring)){inHole=true;break;}}if(!inHole){result17258=true;break;}}
    if(cache17258){
      if(cache17258.size>120000)cache17258.clear();
      cache17258.set(key17258,result17258);
    }
    return result17258;
  }"""
if s.count(old)!=1:
    raise SystemExit(f"point-in jurisdiction anchor count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
