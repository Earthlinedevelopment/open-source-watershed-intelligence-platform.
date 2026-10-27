from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

anchor="""  function earthlineInterpolate16539(a,b,t){return [Number(a[0])+(Number(b[0])-Number(a[0]))*t,Number(a[1])+(Number(b[1])-Number(a[1]))*t];}
"""
insert="""  const earthlineBoundaryEdgeBoxes16850=new WeakMap();
  function earthlineBoundaryBoxes16850(g){
    if(!g||(typeof g!=='object'&&typeof g!=='function'))return null;
    if(earthlineBoundaryEdgeBoxes16850.has(g))return earthlineBoundaryEdgeBoxes16850.get(g);
    const prepared16850=earthlinePrepareJurisdiction16539(g);if(!prepared16850)return null;
    const boxes16850=[];
    for(const poly16850 of (prepared16850.polygons||[])){
      const rings16850=[poly16850.outer,...(poly16850.holes||[]).map(h16850=>h16850.ring)];
      for(const ring16850 of rings16850){
        if(!Array.isArray(ring16850)||ring16850.length<2)continue;
        for(let i16850=0,j16850=ring16850.length-1;i16850<ring16850.length;j16850=i16850++){
          const a16850=ring16850[j16850],b16850=ring16850[i16850];
          if(!earthlineFinitePoint16539(a16850)||!earthlineFinitePoint16539(b16850))continue;
          boxes16850.push([Math.min(Number(a16850[0]),Number(b16850[0])),Math.min(Number(a16850[1]),Number(b16850[1])),Math.max(Number(a16850[0]),Number(b16850[0])),Math.max(Number(a16850[1]),Number(b16850[1]))]);
        }
      }
    }
    const out16850={prepared:prepared16850,boxes:boxes16850};earthlineBoundaryEdgeBoxes16850.set(g,out16850);return out16850;
  }
  function earthlineBBoxCertifiedInterior16850(bounds16850,g16850){
    if(!Array.isArray(bounds16850)||bounds16850.length<4||!g16850)return false;
    const w16850=Number(bounds16850[0]),s16850=Number(bounds16850[1]),e16850=Number(bounds16850[2]),n16850=Number(bounds16850[3]);
    if(![w16850,s16850,e16850,n16850].every(Number.isFinite)||e16850<w16850||n16850<s16850)return false;
    const idx16850=earthlineBoundaryBoxes16850(g16850);if(!idx16850)return false;
    for(const b16850 of idx16850.boxes)if(b16850[2]>=w16850&&b16850[0]<=e16850&&b16850[3]>=s16850&&b16850[1]<=n16850)return false;
    const probes16850=[[w16850,s16850],[e16850,s16850],[e16850,n16850],[w16850,n16850],[(w16850+e16850)/2,(s16850+n16850)/2]];
    return probes16850.every(p16850=>earthlinePointInJurisdiction16539(p16850,idx16850.prepared));
  }
  function earthlineInterpolate16539(a,b,t){return [Number(a[0])+(Number(b[0])-Number(a[0]))*t,Number(a[1])+(Number(b[1])-Number(a[1]))*t];}
"""
if s.count(anchor)!=1: raise SystemExit(f"helper anchor count {s.count(anchor)}")
s=s.replace(anchor,insert,1)

old_clip="""    const pts=[raw[0]];for(let i=1;i<raw.length;i++){const a=raw[i-1],b=raw[i],steps=Math.max(1,Math.ceil(Math.max(Math.abs(Number(b[0])-Number(a[0])),Math.abs(Number(b[1])-Number(a[1])))/.01));for(let k=1;k<=steps;k++)pts.push(earthlineInterpolate16539(a,b,k/steps));}
    const runs=[];let run=[];let prev=pts[0],prevIn=earthlinePointInJurisdiction16539(prev,g);"""
new_clip="""    const pts=[raw[0]];for(let i=1;i<raw.length;i++){const a=raw[i-1],b=raw[i],steps=Math.max(1,Math.ceil(Math.max(Math.abs(Number(b[0])-Number(a[0])),Math.abs(Number(b[1])-Number(a[1])))/.01));for(let k=1;k<=steps;k++)pts.push(earthlineInterpolate16539(a,b,k/steps));}
    if(g&&g.earthlineCertifiedInterior16850===true)return [pts];
    const runs=[];let run=[];let prev=pts[0],prevIn=earthlinePointInJurisdiction16539(prev,g);"""
if s.count(old_clip)!=1: raise SystemExit(f"clip anchor count {s.count(old_clip)}")
s=s.replace(old_clip,new_clip,1)

old_call="""const savedGen16839=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167,c16839=await makeContours(sub16839,true,levels16839),s16839=await makeSwales(sub16839,c16839,false,swaleJurisdictionGeometry16539,null);window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16839;"""
new_call="""const savedGen16839=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167,c16839=await makeContours(sub16839,true,levels16839),jurisdiction16850=earthlineBBoxCertifiedInterior16850(sub16839.bounds,swaleJurisdictionGeometry16539)?{earthlineCertifiedInterior16850:true}:swaleJurisdictionGeometry16539,s16839=await makeSwales(sub16839,c16839,false,jurisdiction16850,null);window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16839;"""
if s.count(old_call)!=1: raise SystemExit(f"supertile call anchor count {s.count(old_call)}")
s=s.replace(old_call,new_call,1)

p.write_text(s,encoding="utf-8")
print("certified interior supertile clip fast path 17301")
