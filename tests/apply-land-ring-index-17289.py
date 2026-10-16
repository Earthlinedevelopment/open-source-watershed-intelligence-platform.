from pathlib import Path
import re
p=Path("index.html")
s=p.read_text(encoding="utf-8")

pat=r"""  function earthlinePointInRing16584\(x16584,y16584,ring16584\)\{[\s\S]*?\n  \}\n  function earthlinePointInPolygon16584"""
m=re.search(pat,s)
print("ring-owner anchors",1 if m else 0)
if not m:
    raise SystemExit("earthlinePointInRing16584 owner not found exactly once")

new=r'''  const earthlineLandRingYIndex17289=new WeakMap();
  function earthlinePrepareLandRingYIndex17289(ring17289){
    if(!Array.isArray(ring17289)||ring17289.length<3)return null;
    const cached17289=earthlineLandRingYIndex17289.get(ring17289);if(cached17289)return cached17289;
    const scale17289=16,bins17289=new Map();
    for(let i17289=0,j17289=ring17289.length-1;i17289<ring17289.length;j17289=i17289++){
      const a17289=ring17289[i17289],b17289=ring17289[j17289];if(!a17289||!b17289)continue;
      const xi17289=Number(a17289[0]),yi17289=Number(a17289[1]),xj17289=Number(b17289[0]),yj17289=Number(b17289[1]);
      if(![xi17289,yi17289,xj17289,yj17289].every(Number.isFinite))continue;
      const edge17289={xi:xi17289,yi:yi17289,xj:xj17289,yj:yj17289};
      const lo17289=Math.floor(Math.min(yi17289,yj17289)*scale17289),hi17289=Math.floor(Math.max(yi17289,yj17289)*scale17289);
      for(let k17289=lo17289;k17289<=hi17289;k17289++){let list17289=bins17289.get(k17289);if(!list17289)bins17289.set(k17289,list17289=[]);list17289.push(edge17289);}
    }
    const prepared17289={scale:scale17289,bins:bins17289};earthlineLandRingYIndex17289.set(ring17289,prepared17289);return prepared17289;
  }
  function earthlinePointInRing16584(x16584,y16584,ring16584){
    let inside16584=false;
    const prepared17289=earthlinePrepareLandRingYIndex17289(ring16584);if(!prepared17289)return false;
    const edges17289=prepared17289.bins.get(Math.floor(Number(y16584)*prepared17289.scale))||[];
    for(const e17289 of edges17289){
      const xi16584=e17289.xi,yi16584=e17289.yi,xj16584=e17289.xj,yj16584=e17289.yj;
      if(((yi16584>y16584)!==(yj16584>y16584))&&
         (x16584<(xj16584-xi16584)*(y16584-yi16584)/((yj16584-yi16584)||1e-15)+xi16584))
        inside16584=!inside16584;
    }
    return inside16584;
  }
  function earthlinePointInPolygon16584'''
s=s[:m.start()]+new+s[m.end():]
s="/* EARTHLINE_LAND_RING_INDEX_17289 — exact Natural Earth ring ray-crossing with latitude-band edge candidate index; final PIP formula unchanged. */\n"+s
p.write_text(s,encoding="utf-8")
print("17289 exact land/lake ring index applied")
