from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

# 1) Multipart extent: keep a dominant spatial cluster only when it owns >=90% of
# significant polygon area. This removes remote tiny water-boundary components
# without state/country exceptions.
old1="""    if(!kept16712.length)return {bbox:fallback16712,trimmed:false,reason:'no-significant-components'};
    const robust16712=[
      Math.min(...kept16712.map(r=>r.bbox[0])),
      Math.min(...kept16712.map(r=>r.bbox[1])),
      Math.max(...kept16712.map(r=>r.bbox[2])),
      Math.max(...kept16712.map(r=>r.bbox[3]))
    ];"""
new1="""    if(!kept16712.length)return {bbox:fallback16712,trimmed:false,reason:'no-significant-components'};
    let effectiveKept16722=kept16712,clusterTrimmed16722=false,dominantClusterShare16722=1;
    if(kept16712.length>1){
      const sorted16722=kept16712.slice().sort((a16722,b16722)=>((a16722.bbox[0]+a16722.bbox[2])/2)-((b16722.bbox[0]+b16722.bbox[2])/2));
      const clusters16722=[];let cluster16722=[];
      for(const row16722 of sorted16722){
        const cx16722=(row16722.bbox[0]+row16722.bbox[2])/2;
        if(cluster16722.length){
          const prev16722=cluster16722[cluster16722.length-1],pcx16722=(prev16722.bbox[0]+prev16722.bbox[2])/2;
          if(cx16722-pcx16722>4){clusters16722.push(cluster16722);cluster16722=[];}
        }
        cluster16722.push(row16722);
      }
      if(cluster16722.length)clusters16722.push(cluster16722);
      const weight16722=r16722=>Math.max(1e-12,Number(r16722.trueArea16719)||Number(r16722.area)||0);
      const total16722=clusters16722.reduce((sum16722,c16722)=>sum16722+c16722.reduce((s16722,r16722)=>s16722+weight16722(r16722),0),0);
      const ranked16722=clusters16722.map(c16722=>({rows:c16722,weight:c16722.reduce((s16722,r16722)=>s16722+weight16722(r16722),0)})).sort((a16722,b16722)=>b16722.weight-a16722.weight);
      if(ranked16722.length>1&&total16722>0){
        dominantClusterShare16722=ranked16722[0].weight/total16722;
        if(dominantClusterShare16722>=.90){effectiveKept16722=ranked16722[0].rows;clusterTrimmed16722=true;}
      }
    }
    const robust16712=[
      Math.min(...effectiveKept16722.map(r=>r.bbox[0])),
      Math.min(...effectiveKept16722.map(r=>r.bbox[1])),
      Math.max(...effectiveKept16722.map(r=>r.bbox[2])),
      Math.max(...effectiveKept16722.map(r=>r.bbox[3]))
    ];"""

old2="""    return {bbox:(inflated16712?robust16712:fallback16712),trimmed:inflated16712,rawBBox:fallback16712,robustBBox:robust16712,componentCount:rows16712.length,keptComponents:kept16712.length,largestComponentAreaProxy:maxArea16712,largestTrueAreaProxy16719:maxTrueArea16719,rule:'use components that are significant by both bbox scale and true polygon area when remote multipart geometry inflates the statewide analysis envelope by >=35%'};"""
new2="""    return {bbox:(inflated16712?robust16712:fallback16712),trimmed:inflated16712,rawBBox:fallback16712,robustBBox:robust16712,componentCount:rows16712.length,keptComponents:kept16712.length,effectiveComponents16722:effectiveKept16722.length,clusterTrimmed16722,dominantClusterShare16722:Number(dominantClusterShare16722.toFixed(4)),largestComponentAreaProxy:maxArea16712,largestTrueAreaProxy16719:maxTrueArea16719,rule:'use significant true-area components; if one spatial cluster owns >=90% of significant area, remote clusters cannot inflate the analysis envelope'};"""

# 2) Exact ring ray-casting acceleration. The same ray-casting logic is used,
# but only boundary edges whose latitude range can cross the query latitude are tested.
anchor="""  function earthlinePrepareJurisdiction16539(g){"""
insert="""  const earthlineRingIndexCache16722=new WeakMap();
  function earthlinePointInRingIndexed16722(p16722,ring16722){
    if(!earthlineFinitePoint16539(p16722)||!Array.isArray(ring16722)||ring16722.length<3)return false;
    let idx16722=earthlineRingIndexCache16722.get(ring16722);
    if(!idx16722){
      const scale16722=4,bins16722=new Map();
      for(let i16722=0,j16722=ring16722.length-1;i16722<ring16722.length;j16722=i16722++){
        const a16722=ring16722[j16722],b16722=ring16722[i16722];
        if(!earthlineFinitePoint16539(a16722)||!earthlineFinitePoint16539(b16722))continue;
        const lo16722=Math.floor(Math.min(Number(a16722[1]),Number(b16722[1]))*scale16722);
        const hi16722=Math.floor(Math.max(Number(a16722[1]),Number(b16722[1]))*scale16722);
        const edge16722=[a16722,b16722];
        for(let bin16722=lo16722;bin16722<=hi16722;bin16722++){
          let list16722=bins16722.get(bin16722);if(!list16722)bins16722.set(bin16722,list16722=[]);list16722.push(edge16722);
        }
      }
      idx16722={scale:scale16722,bins:bins16722};earthlineRingIndexCache16722.set(ring16722,idx16722);
    }
    const x16722=Number(p16722[0]),y16722=Number(p16722[1]),edges16722=idx16722.bins.get(Math.floor(y16722*idx16722.scale))||[];
    let inside16722=false;
    for(const edge16722 of edges16722){
      const a16722=edge16722[0],b16722=edge16722[1];
      if(earthlinePointOnSegment16539(p16722,a16722,b16722))return true;
      const xi16722=Number(b16722[0]),yi16722=Number(b16722[1]),xj16722=Number(a16722[0]),yj16722=Number(a16722[1]);
      if(((yi16722>y16722)!==(yj16722>y16722))&&(x16722<(xj16722-xi16722)*(y16722-yi16722)/((yj16722-yi16722)||1e-15)+xi16722))inside16722=!inside16722;
    }
    return inside16722;
  }
  function earthlinePrepareJurisdiction16539(g){"""

old3="""    for(const poly of prepared.polygons||[]){if(!earthlineBBoxContains16539(poly.bbox,p)||!earthlinePointInRing16539(p,poly.outer))continue;let inHole=false;for(const h of poly.holes||[]){if(earthlineBBoxContains16539(h.bbox,p)&&earthlinePointInRing16539(p,h.ring)){inHole=true;break;}}if(!inHole)return true;}"""
new3="""    for(const poly of prepared.polygons||[]){if(!earthlineBBoxContains16539(poly.bbox,p)||!earthlinePointInRingIndexed16722(p,poly.outer))continue;let inHole=false;for(const h of poly.holes||[]){if(earthlineBBoxContains16539(h.bbox,p)&&earthlinePointInRingIndexed16722(p,h.ring)){inHole=true;break;}}if(!inHole)return true;}"""

for name,old,new in [("cluster",old1,new1),("audit",old2,new2),("index-insert",anchor,insert),("pip",old3,new3)]:
    n=s.count(old)
    if n!=1: raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

p.write_text(s,encoding="utf-8")
print("16722 applied")
