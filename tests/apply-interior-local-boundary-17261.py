from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

anchor="""  function earthlinePointInJurisdiction16539(p,g){
    if(!g)return false;
    const prepared=earthlinePrepareJurisdiction16539(g);if(!prepared)return false;
    for(const poly of prepared.polygons||[]){if(!earthlineBBoxContains16539(poly.bbox,p)||!earthlinePointInRingIndexed16722(p,poly.outer))continue;let inHole=false;for(const h of poly.holes||[]){if(earthlineBBoxContains16539(h.bbox,p)&&earthlinePointInRingIndexed16722(p,h.ring)){inHole=true;break;}}if(!inHole)return true;}
    return false;
  }
"""
helper="""  function earthlinePointInJurisdiction16539(p,g){
    if(!g)return false;
    const prepared=earthlinePrepareJurisdiction16539(g);if(!prepared)return false;
    for(const poly of prepared.polygons||[]){if(!earthlineBBoxContains16539(poly.bbox,p)||!earthlinePointInRingIndexed16722(p,poly.outer))continue;let inHole=false;for(const h of poly.holes||[]){if(earthlineBBoxContains16539(h.bbox,p)&&earthlinePointInRingIndexed16722(p,h.ring)){inHole=true;break;}}if(!inHole)return true;}
    return false;
  }
  const earthlineJurisdictionEdgeBoxes17261=new WeakMap();
  function earthlineBoundsProvablyInsideJurisdiction17261(bounds17261,g17261){
    if(!Array.isArray(bounds17261)||bounds17261.length<4||!g17261||typeof g17261!=='object')return false;
    const w17261=Number(bounds17261[0]),s17261=Number(bounds17261[1]),e17261=Number(bounds17261[2]),n17261=Number(bounds17261[3]);
    if(![w17261,s17261,e17261,n17261].every(Number.isFinite)||!(e17261>w17261)||!(n17261>s17261))return false;
    const prepared17261=earthlinePrepareJurisdiction16539(g17261);if(!prepared17261)return false;
    const corners17261=[[w17261,s17261],[w17261,n17261],[e17261,s17261],[e17261,n17261]];
    if(!corners17261.every(p17261=>earthlinePointInJurisdiction16539(p17261,prepared17261)))return false;
    let edges17261=earthlineJurisdictionEdgeBoxes17261.get(prepared17261);
    if(!edges17261){
      edges17261=[];
      const addRing17261=ring17261=>{
        if(!Array.isArray(ring17261)||ring17261.length<2)return;
        for(let i17261=0,j17261=ring17261.length-1;i17261<ring17261.length;j17261=i17261++){
          const a17261=ring17261[j17261],b17261=ring17261[i17261];
          if(!earthlineFinitePoint16539(a17261)||!earthlineFinitePoint16539(b17261))continue;
          const ax17261=Number(a17261[0]),ay17261=Number(a17261[1]),bx17261=Number(b17261[0]),by17261=Number(b17261[1]);
          edges17261.push([Math.min(ax17261,bx17261),Math.min(ay17261,by17261),Math.max(ax17261,bx17261),Math.max(ay17261,by17261)]);
        }
      };
      for(const poly17261 of (prepared17261.polygons||[])){addRing17261(poly17261.outer);for(const h17261 of (poly17261.holes||[]))addRing17261(h17261.ring);}
      earthlineJurisdictionEdgeBoxes17261.set(prepared17261,edges17261);
    }
    for(const b17261 of edges17261){
      if(b17261[2]>=w17261&&b17261[0]<=e17261&&b17261[3]>=s17261&&b17261[1]<=n17261)return false;
    }
    return true;
  }
  function earthlineLocalJurisdiction17261(h17261,g17261){
    return h17261&&earthlineBoundsProvablyInsideJurisdiction17261(h17261.bounds,g17261)?null:g17261;
  }
"""
if s.count(anchor)!=1: raise SystemExit("point jurisdiction anchor count "+str(s.count(anchor)))
s=s.replace(anchor,helper,1)

repls={
"makeSwales(h16702,c16702,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16702,c16702,false,earthlineLocalJurisdiction17261(h16702,swaleJurisdictionGeometry16539),null)",
"makeSwales(h16730,c16730,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16730,c16730,false,earthlineLocalJurisdiction17261(h16730,swaleJurisdictionGeometry16539),null)",
"makeSwales(sub16839,c16839,false,swaleJurisdictionGeometry16539,null)":"makeSwales(sub16839,c16839,false,earthlineLocalJurisdiction17261(sub16839,swaleJurisdictionGeometry16539),null)",
"makeSwales(h16780,c16780,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16780,c16780,false,earthlineLocalJurisdiction17261(h16780,swaleJurisdictionGeometry16539),null)",
"makeSwales(h16731,c16731,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16731,c16731,false,earthlineLocalJurisdiction17261(h16731,swaleJurisdictionGeometry16539),null)",
"makeSwales(h16741,c16741,false,swaleJurisdictionGeometry16539,null)":"makeSwales(h16741,c16741,false,earthlineLocalJurisdiction17261(h16741,swaleJurisdictionGeometry16539),null)"
}
hits=0
for old,new in repls.items():
    n=s.count(old)
    print(old,n)
    if n:
        s=s.replace(old,new)
        hits+=n
if hits<3: raise SystemExit("too few local refinement call anchors: "+str(hits))
print("replaced",hits)
p.write_text(s,encoding="utf-8")
