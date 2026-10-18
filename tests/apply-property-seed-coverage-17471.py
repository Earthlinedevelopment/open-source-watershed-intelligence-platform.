from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    found.sort((a,b)=>
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
new="""    found.sort((a,b)=>
      b.flowCrossingValue-a.flowCrossingValue||
      b.legacyQuality-a.legacyQuality||
      b.accumulation-a.accumulation||
      a.y-b.y||a.x-b.x
    );
    const out=[];
    const seedSpacing17471=regional?18:24;
    const canAdd17471=c=>out.every(s=>Math.hypot(c.x-s.x,c.y-s.y)>seedSpacing17471);
    if(!regional&&maxSeeds>0){
      /* EARTHLINE 17471 — Property-only spatial seed coverage.
         Preserve the existing eligible contour cells, ranking, spacing threshold,
         flow-crossing score and all downstream geometry/safety gates. Reserve at
         most one highest-ranked real seed from each supported 4x4 parcel zone
         before the unchanged global fill so one hillside cannot consume every
         per-level seed slot. */
      const bestByZone17471=new Map();
      for(const c of found){
        const zx=Math.max(0,Math.min(3,Math.floor(Number(c.x)*4/Math.max(1,GW))));
        const zy=Math.max(0,Math.min(3,Math.floor(Number(c.y)*4/Math.max(1,GH))));
        const key=zy*4+zx;
        if(!bestByZone17471.has(key))bestByZone17471.set(key,c);
      }
      const reserved17471=Array.from(bestByZone17471.values()).sort((a,b)=>
        b.flowCrossingValue-a.flowCrossingValue||
        b.legacyQuality-a.legacyQuality||
        b.accumulation-a.accumulation||
        a.y-b.y||a.x-b.x
      );
      for(const c of reserved17471){
        if(canAdd17471(c))out.push(c);
        if(out.length>=maxSeeds)break;
      }
    }
    for(const c of found){
      if(out.includes(c))continue;
      if(canAdd17471(c))out.push(c);
      if(out.length>=maxSeeds)break;
    }
    if(!regional)window.EARTHLINE_PROPERTY_SEED_COVERAGE_17471={
      build:'EARTHLINE 17471',level:Number(L),eligible:found.length,selected:out.length,
      selectedZones:Array.from(new Set(out.map(c=>Math.max(0,Math.min(3,Math.floor(Number(c.y)*4/Math.max(1,GH))))*4+Math.max(0,Math.min(3,Math.floor(Number(c.x)*4/Math.max(1,GW))))))).sort((a,b)=>a-b),
      rule:'existing eligible real contour seeds only; one best-per-supported-zone reservation before unchanged rank fill; existing spacing retained',
      at:new Date().toISOString()
    };
"""
if s.count(old)!=1: raise SystemExit(f"seed selector anchor count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("installed Property spatial seed coverage 17471")
