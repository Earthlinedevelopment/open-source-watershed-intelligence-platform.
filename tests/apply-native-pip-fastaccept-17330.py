from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
anchor="""  function earthlinePointInJurisdiction16539(p,g){
    if(!g)return false;
    const prepared=earthlinePrepareJurisdiction16539(g);if(!prepared)return false;
    for(const poly of prepared.polygons||[]){if(!earthlineBBoxContains16539(poly.bbox,p)||!earthlinePointInRingIndexed16722(p,poly.outer))continue;let inHole=false;for(const h of poly.holes||[]){if(earthlineBBoxContains16539(h.bbox,p)&&earthlinePointInRingIndexed16722(p,h.ring)){inHole=true;break;}}if(!inHole)return true;}
    return false;
  }"""
if s.count(anchor)!=1: raise SystemExit(f"jurisdiction PIP anchor count {s.count(anchor)}")
new=r'''  const earthlineNativeJurisdictionPath17330=new WeakMap();
  let earthlineNativeJurisdictionCtx17330=null;
  function earthlineNativeJurisdictionContext17330(){
    if(earthlineNativeJurisdictionCtx17330)return earthlineNativeJurisdictionCtx17330;
    try{
      if(typeof document==='undefined'||typeof Path2D!=='function')return null;
      const c17330=document.createElement('canvas');
      earthlineNativeJurisdictionCtx17330=c17330.getContext('2d');
      return earthlineNativeJurisdictionCtx17330;
    }catch(_){return null;}
  }
  function earthlineNativeJurisdictionPathBuild17330(g17330,prepared17330){
    if(!g17330||(typeof g17330!=='object'&&typeof g17330!=='function')||typeof Path2D!=='function')return null;
    const cached17330=earthlineNativeJurisdictionPath17330.get(g17330);if(cached17330)return cached17330;
    try{
      const path17330=new Path2D();
      for(const poly17330 of (prepared17330&&prepared17330.polygons||[])){
        for(const ring17330 of [poly17330.outer,...(poly17330.holes||[]).map(h17330=>h17330.ring)]){
          if(!Array.isArray(ring17330)||ring17330.length<3)continue;
          let started17330=false;
          for(const pt17330 of ring17330){
            if(!earthlineFinitePoint16539(pt17330))continue;
            const x17330=Number(pt17330[0]),y17330=Number(pt17330[1]);
            if(!started17330){path17330.moveTo(x17330,y17330);started17330=true;}
            else path17330.lineTo(x17330,y17330);
          }
          if(started17330)path17330.closePath();
        }
      }
      const out17330={path:path17330};earthlineNativeJurisdictionPath17330.set(g17330,out17330);return out17330;
    }catch(_){return null;}
  }
  function earthlinePointInJurisdiction16539(p,g){
    if(!g)return false;
    const prepared=earthlinePrepareJurisdiction16539(g);if(!prepared)return false;
    const ctx17330=earthlineNativeJurisdictionContext17330(),native17330=ctx17330&&earthlineNativeJurisdictionPathBuild17330(g,prepared);
    if(native17330&&earthlineFinitePoint16539(p)){
      try{if(ctx17330.isPointInPath(native17330.path,Number(p[0]),Number(p[1]),'evenodd'))return true;}catch(_){}
    }
    for(const poly of prepared.polygons||[]){if(!earthlineBBoxContains16539(poly.bbox,p)||!earthlinePointInRingIndexed16722(p,poly.outer))continue;let inHole=false;for(const h of poly.holes||[]){if(earthlineBBoxContains16539(h.bbox,p)&&earthlinePointInRingIndexed16722(p,h.ring)){inHole=true;break;}}if(!inHole)return true;}
    return false;
  }'''
s=s.replace(anchor,new,1)
s="<!-- EARTHLINE_NATIVE_PIP_FAST_ACCEPT_17330: browser-native Path2D/evenodd fast accept for interior points; existing exact JS jurisdiction test remains authoritative fallback for native outside/edge cases. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed native Path2D jurisdiction fast-accept 17330")
