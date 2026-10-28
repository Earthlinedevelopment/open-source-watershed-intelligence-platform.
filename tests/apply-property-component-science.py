from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else "index.html")
s = path.read_text(encoding="utf-8")

old_stride = "const stride=regional?4:2"
if s.count(old_stride) != 2:
    raise SystemExit(f"expected exactly two Property seed stride owners; found {s.count(old_stride)}")
s = s.replace(old_stride, "const stride=regional?4:1")

old = """    found.sort((a,b)=>
      b.flowCrossingValue-a.flowCrossingValue||
      b.legacyQuality-a.legacyQuality||
      b.accumulation-a.accumulation||
      a.y-b.y||a.x-b.x
    );
    const out=[];
    for(const c of found){
      if(out.every(s=>Math.hypot(c.x-s.x,c.y-s.y)>(regional?18:24)))out.push(c);
      if(out.length>=maxSeeds)break;
    }
"""

new = """    found.sort((a,b)=>
      b.flowCrossingValue-a.flowCrossingValue||
      b.legacyQuality-a.legacyQuality||
      b.accumulation-a.accumulation||
      a.y-b.y||a.x-b.x
    );
    const out=[];
    if(regional){
      for(const c of found){
        if(out.every(s=>Math.hypot(c.x-s.x,c.y-s.y)>18))out.push(c);
        if(out.length>=maxSeeds)break;
      }
    }else{
      const byCell=new Map(found.map(c=>[c.x+","+c.y,c]));
      const seen=new Set();
      for(const c of found){
        const key=c.x+","+c.y;
        if(seen.has(key))continue;
        out.push(c);
        const queue=[c];seen.add(key);
        for(let qi=0;qi<queue.length;qi++){
          const q=queue[qi];
          for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
            if(!dx&&!dy)continue;
            const nk=(q.x+dx)+","+(q.y+dy);
            if(seen.has(nk))continue;
            const n=byCell.get(nk);
            if(n){seen.add(nk);queue.push(n);}
          }
        }
        if(out.length>=maxSeeds)break;
      }
      M.propertyContourComponentSeedAudit={
        build:"EARTHLINE PROPERTY <=4% COMPONENT COVERAGE",
        level:Number(L),eligibleCrossingCells:found.length,
        selectedComponents:out.length,maxSeeds,at:new Date().toISOString()
      };
    }
"""

if s.count(old) != 1:
    raise SystemExit(f"expected one canonical seed-selection owner; found {s.count(old)}")

s = s.replace(old, new)
path.write_text(s, encoding="utf-8")
print("PROPERTY_COMPONENT_SCIENCE_READY")
