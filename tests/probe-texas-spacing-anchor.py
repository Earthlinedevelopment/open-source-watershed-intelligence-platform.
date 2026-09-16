from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="""      const mid16539=segment16539[Math.floor((segment16539.length-1)/2)],grid16539=llGrid(hy,mid16539);
      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y))return null;
      return Object.assign({},candidate16539,{
        segment:segment16539,
        x:Math.max(1,Math.min(hy.w-2,Math.round(grid16539.x))),
        y:Math.max(1,Math.min(hy.h-2,Math.round(grid16539.y))),
        jurisdiction_screened:true
      });
"""
new="""      const originalLL16539=gridLL(hy,candidate16539.x,candidate16539.y);
      const originalInside16539=earthlinePointInJurisdiction16539(originalLL16539,jurisdictionGeometry16539);
      let grid16539=originalInside16539?{x:candidate16539.x,y:candidate16539.y}:null;
      if(!grid16539){
        let best16539=null,bestDistance16539=Infinity;
        for(const point16539 of segment16539){
          const g16539=llGrid(hy,point16539);
          if(!g16539||!Number.isFinite(g16539.x)||!Number.isFinite(g16539.y))continue;
          const d16539=Math.hypot(g16539.x-candidate16539.x,g16539.y-candidate16539.y);
          if(d16539<bestDistance16539){bestDistance16539=d16539;best16539=g16539;}
        }
        grid16539=best16539;
      }
      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y))return null;
      return Object.assign({},candidate16539,{
        segment:segment16539,
        x:Math.max(1,Math.min(hy.w-2,Math.round(grid16539.x))),
        y:Math.max(1,Math.min(hy.h-2,Math.round(grid16539.y))),
        jurisdiction_screened:true,
        jurisdiction_original_anchor_inside:!!originalInside16539
      });
"""
count=s.count(old)
if count!=1: raise SystemExit(f'expected current clipped-midpoint anchor block once, found {count}')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('local probe variant: preserve original in-jurisdiction spacing anchor; nearest clipped point only when original is outside')
