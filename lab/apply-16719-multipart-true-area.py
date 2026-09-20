from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old1="""      const area16712=Math.max(0,lonSpan16712*latSpan16712*Math.max(.05,Math.cos(midLat16712*Math.PI/180)));
      rows16712.push({bbox:b16712.map(Number),rawLon:rawLon16712,area:area16712});"""
new1="""      const area16712=Math.max(0,lonSpan16712*latSpan16712*Math.max(.05,Math.cos(midLat16712*Math.PI/180)));
      let ringArea16719=0;
      const ring16719=Array.isArray(poly16712&&poly16712.outer)?poly16712.outer:[];
      if(ring16719.length>=4){
        let sum16719=0;
        for(let i16719=0,j16719=ring16719.length-1;i16719<ring16719.length;j16719=i16719++){
          const a16719=ring16719[j16719],b16719=ring16719[i16719];
          if(!earthlineFinitePoint16539(a16719)||!earthlineFinitePoint16539(b16719))continue;
          sum16719+=Number(a16719[0])*Number(b16719[1])-Number(b16719[0])*Number(a16719[1]);
        }
        ringArea16719=Math.abs(sum16719)*.5*Math.max(.05,Math.cos(midLat16712*Math.PI/180));
      }
      rows16712.push({bbox:b16712.map(Number),rawLon:rawLon16712,area:area16712,trueArea16719:ringArea16719});"""

old2="""    const maxArea16712=Math.max(...rows16712.map(r=>r.area)),kept16712=rows16712.filter(r=>r.area>=maxArea16712*.02&&r.rawLon<=180);
    if(!kept16712.length)return {bbox:fallback16712,trimmed:false,reason:'no-significant-components'};"""
new2="""    const maxArea16712=Math.max(...rows16712.map(r=>r.area)),maxTrueArea16719=Math.max(...rows16712.map(r=>Number(r.trueArea16719)||0));
    const kept16712=rows16712.filter(r=>r.area>=maxArea16712*.02&&r.rawLon<=180&&(
      maxTrueArea16719<=0||(Number(r.trueArea16719)||0)>=maxTrueArea16719*.005
    ));
    if(!kept16712.length)return {bbox:fallback16712,trimmed:false,reason:'no-significant-components'};"""

old3="""    return {bbox:(inflated16712?robust16712:fallback16712),trimmed:inflated16712,rawBBox:fallback16712,robustBBox:robust16712,componentCount:rows16712.length,keptComponents:kept16712.length,largestComponentAreaProxy:maxArea16712,rule:'use significant land components only when remote multipart geometry inflates the statewide analysis envelope by >=35%'};"""
new3="""    return {bbox:(inflated16712?robust16712:fallback16712),trimmed:inflated16712,rawBBox:fallback16712,robustBBox:robust16712,componentCount:rows16712.length,keptComponents:kept16712.length,largestComponentAreaProxy:maxArea16712,largestTrueAreaProxy16719:maxTrueArea16719,rule:'use components that are significant by both bbox scale and true polygon area when remote multipart geometry inflates the statewide analysis envelope by >=35%'};"""

for name,old,new in [("area",old1,new1),("filter",old2,new2),("audit",old3,new3)]:
    n=s.count(old)
    if n!=1: raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

p.write_text(s,encoding="utf-8")
print("16719 applied")
