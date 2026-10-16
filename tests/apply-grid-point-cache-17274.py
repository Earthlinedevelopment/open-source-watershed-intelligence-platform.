from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="function earthlinePointInJurisdiction16539(p,g){"
n=s.count(old)
print("point owner",n)
if n!=1: raise SystemExit(f"point owner expected once, found {n}")
s=s.replace(old,"function earthlinePointInJurisdiction16539Uncached17274(p,g){",1)

wrapper=r'''
  const earthlineJurisdictionPointCache17274=new WeakMap();
  function earthlinePointInJurisdiction16539(p,g){
    if(!g)return false;
    const cacheable17274=(typeof g==='object'&&g!==null&&earthlineFinitePoint16539(p));
    let cache17274=null,key17274='';
    if(cacheable17274){
      cache17274=earthlineJurisdictionPointCache17274.get(g);
      if(!cache17274){cache17274=new Map();earthlineJurisdictionPointCache17274.set(g,cache17274);}
      key17274=String(Number(p[0]))+'|'+String(Number(p[1]));
      if(cache17274.has(key17274)){
        window.EARTHLINE_JURISDICTION_POINT_CACHE_17274=window.EARTHLINE_JURISDICTION_POINT_CACHE_17274||{hits:0,misses:0,at:new Date().toISOString()};
        window.EARTHLINE_JURISDICTION_POINT_CACHE_17274.hits++;
        return cache17274.get(key17274);
      }
    }
    window.EARTHLINE_JURISDICTION_POINT_CACHE_17274=window.EARTHLINE_JURISDICTION_POINT_CACHE_17274||{hits:0,misses:0,at:new Date().toISOString()};
    window.EARTHLINE_JURISDICTION_POINT_CACHE_17274.misses++;
    const result17274=earthlinePointInJurisdiction16539Uncached17274(p,g);
    if(cache17274){
      if(cache17274.size>160000)cache17274.clear();
      cache17274.set(key17274,result17274);
    }
    return result17274;
  }

'''
anchor="  /* EARTHLINE 17270 — exact interior/exterior certification for candidate screening."
n=s.count(anchor)
print("17270 helper anchor",n)
if n!=1: raise SystemExit(f"17270 helper anchor expected once, found {n}")
pos=s.index(anchor)
s=s[:pos]+wrapper+s[pos:]
s="/* EARTHLINE_GRID_POINT_JURISDICTION_CACHE_17274 — exact PIP results reused for repeated identical grid points; no geometry decision changed. */\n"+s
p.write_text(s,encoding="utf-8")
print("17274 exact jurisdiction point cache applied")
