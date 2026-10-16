from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""  function earthlineClipLine16539(coords,g){
    const raw=(coords||[]).filter(earthlineFinitePoint16539);if(raw.length<2)return [];
    const pts=[raw[0]];for(let i=1;i<raw.length;i++){const a=raw[i-1],b=raw[i],steps=Math.max(1,Math.ceil(Math.max(Math.abs(Number(b[0])-Number(a[0])),Math.abs(Number(b[1])-Number(a[1])))/.01));for(let k=1;k<=steps;k++)pts.push(earthlineInterpolate16539(a,b,k/steps));}
    const runs=[];let run=[];let prev=pts[0],prevIn=earthlinePointInJurisdiction16539(prev,g);if(prevIn)run=[prev];
    for(let i=1;i<pts.length;i++){const cur=pts[i],curIn=earthlinePointInJurisdiction16539(cur,g);if(prevIn&&curIn){if(!run.length)run=[prev];run.push(cur)}else if(prevIn&&!curIn){const x=earthlineBoundaryPoint16539(prev,cur,g,true);if(!run.length)run=[prev];run.push(x);if(run.length>=2)runs.push(run);run=[]}else if(!prevIn&&curIn){const x=earthlineBoundaryPoint16539(prev,cur,g,false);run=[x,cur]}prev=cur;prevIn=curIn;}
    if(run.length>=2)runs.push(run);return runs;
  }"""
new="""  const earthlineBoundaryEdgeIndex17295=new WeakMap();
  function earthlineBoundaryIndex17295(g){
    if(!g||(typeof g!=='object'&&typeof g!=='function'))return null;
    if(earthlineBoundaryEdgeIndex17295.has(g))return earthlineBoundaryEdgeIndex17295.get(g);
    const prepared17295=earthlinePrepareJurisdiction16539(g);if(!prepared17295)return null;
    const scale17295=4,bins17295=new Map();
    for(const poly17295 of (prepared17295.polygons||[])){
      const rings17295=[poly17295.outer,...(poly17295.holes||[]).map(h17295=>h17295.ring)];
      for(const ring17295 of rings17295){
        if(!Array.isArray(ring17295)||ring17295.length<2)continue;
        for(let i17295=0,j17295=ring17295.length-1;i17295<ring17295.length;j17295=i17295++){
          const a17295=ring17295[j17295],b17295=ring17295[i17295];
          if(!earthlineFinitePoint16539(a17295)||!earthlineFinitePoint16539(b17295))continue;
          const minx17295=Math.min(Number(a17295[0]),Number(b17295[0])),maxx17295=Math.max(Number(a17295[0]),Number(b17295[0])),
                miny17295=Math.min(Number(a17295[1]),Number(b17295[1])),maxy17295=Math.max(Number(a17295[1]),Number(b17295[1])),
                edge17295=[minx17295,miny17295,maxx17295,maxy17295];
          const lo17295=Math.floor(miny17295*scale17295),hi17295=Math.floor(maxy17295*scale17295);
          for(let bin17295=lo17295;bin17295<=hi17295;bin17295++){
            let list17295=bins17295.get(bin17295);if(!list17295)bins17295.set(bin17295,list17295=[]);list17295.push(edge17295);
          }
        }
      }
    }
    const idx17295={prepared:prepared17295,scale:scale17295,bins:bins17295};
    earthlineBoundaryEdgeIndex17295.set(g,idx17295);
    return idx17295;
  }
  function earthlineDefinitelyInteriorLine17295(raw17295,idx17295){
    if(!idx17295||!raw17295||raw17295.length<2||!earthlinePointInJurisdiction16539(raw17295[0],idx17295.prepared))return false;
    const seen17295=new Set();
    for(let i17295=1;i17295<raw17295.length;i17295++){
      const a17295=raw17295[i17295-1],b17295=raw17295[i17295],
            minx17295=Math.min(Number(a17295[0]),Number(b17295[0])),maxx17295=Math.max(Number(a17295[0]),Number(b17295[0])),
            miny17295=Math.min(Number(a17295[1]),Number(b17295[1])),maxy17295=Math.max(Number(a17295[1]),Number(b17295[1])),
            lo17295=Math.floor(miny17295*idx17295.scale),hi17295=Math.floor(maxy17295*idx17295.scale);
      seen17295.clear();
      for(let bin17295=lo17295;bin17295<=hi17295;bin17295++)for(const edge17295 of (idx17295.bins.get(bin17295)||[])){
        if(seen17295.has(edge17295))continue;seen17295.add(edge17295);
        if(edge17295[2]>=minx17295&&edge17295[0]<=maxx17295&&edge17295[3]>=miny17295&&edge17295[1]<=maxy17295)return false;
      }
    }
    return true;
  }
  function earthlineClipLine16539(coords,g){
    const raw=(coords||[]).filter(earthlineFinitePoint16539);if(raw.length<2)return [];
    const pts=[raw[0]];for(let i=1;i<raw.length;i++){const a=raw[i-1],b=raw[i],steps=Math.max(1,Math.ceil(Math.max(Math.abs(Number(b[0])-Number(a[0])),Math.abs(Number(b[1])-Number(a[1])))/.01));for(let k=1;k<=steps;k++)pts.push(earthlineInterpolate16539(a,b,k/steps));}
    const idx17295=earthlineBoundaryIndex17295(g),screenGeometry17295=idx17295&&idx17295.prepared||g;
    if(earthlineDefinitelyInteriorLine17295(raw,idx17295))return [pts];
    const runs=[];let run=[];let prev=pts[0],prevIn=earthlinePointInJurisdiction16539(prev,screenGeometry17295);if(prevIn)run=[prev];
    for(let i=1;i<pts.length;i++){const cur=pts[i],curIn=earthlinePointInJurisdiction16539(cur,screenGeometry17295);if(prevIn&&curIn){if(!run.length)run=[prev];run.push(cur)}else if(prevIn&&!curIn){const x=earthlineBoundaryPoint16539(prev,cur,screenGeometry17295,true);if(!run.length)run=[prev];run.push(x);if(run.length>=2)runs.push(run);run=[]}else if(!prevIn&&curIn){const x=earthlineBoundaryPoint16539(prev,cur,screenGeometry17295,false);run=[x,cur]}prev=cur;prevIn=curIn;}
    if(run.length>=2)runs.push(run);return runs;
  }"""
if s.count(old)!=1: raise SystemExit(f"anchor count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("installed exact safe-interior jurisdiction clip fast path 17295")
