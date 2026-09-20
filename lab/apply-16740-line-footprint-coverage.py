from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name, old, new):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

# Add a single local helper inside the existing 16731 coverage owner.
anchor="""      const bins16731=[];
      for(let by16731=0;by16731<binsY16731;by16731++)for(let bx16731=0;bx16731<binsX16731;bx16731++){"""
insert="""      function earthlineCoverageBinsForLine16740(coords16740){
        const touched16740=new Set();
        if(!Array.isArray(coords16740)||!coords16740.length)return touched16740;
        const mark16740=p16740=>{
          const g16740=llGrid(hy,p16740);
          if(!g16740||!Number.isFinite(Number(g16740.x))||!Number.isFinite(Number(g16740.y)))return;
          const bx16740=Math.max(0,Math.min(binsX16731-1,Math.floor(Number(g16740.x)*binsX16731/Math.max(1,hy.w))));
          const by16740=Math.max(0,Math.min(binsY16731-1,Math.floor(Number(g16740.y)*binsY16731/Math.max(1,hy.h))));
          touched16740.add(bx16740+','+by16740);
        };
        for(let i16740=0;i16740<coords16740.length;i16740++){
          const a16740=coords16740[i16740];mark16740(a16740);
          if(i16740===0)continue;
          const b16740=coords16740[i16740-1];
          if(!Array.isArray(a16740)||!Array.isArray(b16740))continue;
          for(let t16740=.2;t16740<1;t16740+=.2){
            mark16740([
              Number(b16740[0])+(Number(a16740[0])-Number(b16740[0]))*t16740,
              Number(b16740[1])+(Number(a16740[1])-Number(b16740[1]))*t16740
            ]);
          }
        }
        return touched16740;
      }
      const bins16731=[];
      for(let by16731=0;by16731<binsY16731;by16731++)for(let bx16731=0;bx16731<binsX16731;bx16731++){"""
patch("helper",anchor,insert)

old_initial="""      for(const f16731 of swales.features){
        const coords16731=f16731&&f16731.geometry&&f16731.geometry.type==='LineString'?f16731.geometry.coordinates:null;
        if(!Array.isArray(coords16731)||!coords16731.length)continue;
        const mid16731=coords16731[Math.floor((coords16731.length-1)/2)],g16731=llGrid(hy,mid16731);
        if(!g16731||!Number.isFinite(g16731.x)||!Number.isFinite(g16731.y))continue;
        const bx16731=Math.max(0,Math.min(binsX16731-1,Math.floor(Number(g16731.x)*binsX16731/Math.max(1,hy.w))));
        const by16731=Math.max(0,Math.min(binsY16731-1,Math.floor(Number(g16731.y)*binsY16731/Math.max(1,hy.h))));
        const row16731=bins16731.find(r16731=>r16731.bx===bx16731&&r16731.by===by16731);if(row16731)row16731.swales++;
      }"""
new_initial="""      for(const f16731 of swales.features){
        const coords16731=f16731&&f16731.geometry&&f16731.geometry.type==='LineString'?f16731.geometry.coordinates:null;
        if(!Array.isArray(coords16731)||!coords16731.length)continue;
        for(const key16740 of earthlineCoverageBinsForLine16740(coords16731)){
          const parts16740=key16740.split(','),bx16731=Number(parts16740[0]),by16731=Number(parts16740[1]);
          const row16731=bins16731.find(r16731=>r16731.bx===bx16731&&r16731.by===by16731);
          if(row16731)row16731.swales++;
        }
      }"""
patch("initial-count",old_initial,new_initial)

old_final="""      for(const f16731 of swales.features||[]){
        const c16731=f16731&&f16731.geometry&&f16731.geometry.type==='LineString'?f16731.geometry.coordinates:null;if(!Array.isArray(c16731)||!c16731.length)continue;
        const mid16731=c16731[Math.floor((c16731.length-1)/2)],g16731=llGrid(hy,mid16731);if(!g16731||!Number.isFinite(g16731.x)||!Number.isFinite(g16731.y))continue;
        const bx16731=Math.max(0,Math.min(binsX16731-1,Math.floor(Number(g16731.x)*binsX16731/Math.max(1,hy.w)))),by16731=Math.max(0,Math.min(binsY16731-1,Math.floor(Number(g16731.y)*binsY16731/Math.max(1,hy.h))));
        const row16731=after16731.find(r16731=>r16731.bx===bx16731&&r16731.by===by16731);if(row16731)row16731.swales++;
      }"""
new_final="""      for(const f16731 of swales.features||[]){
        const c16731=f16731&&f16731.geometry&&f16731.geometry.type==='LineString'?f16731.geometry.coordinates:null;if(!Array.isArray(c16731)||!c16731.length)continue;
        for(const key16740 of earthlineCoverageBinsForLine16740(c16731)){
          const parts16740=key16740.split(','),bx16731=Number(parts16740[0]),by16731=Number(parts16740[1]);
          const row16731=after16731.find(r16731=>r16731.bx===bx16731&&r16731.by===by16731);
          if(row16731)row16731.swales++;
        }
      }"""
patch("final-count",old_final,new_final)

old_audit="""window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731={build:'EARTHLINE 16735',confirmedNull16735:Array.from(confirmedNullKeys16735),bins:after16731.map"""
new_audit="""window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731={build:'EARTHLINE 16740',coverageMetric:'line-footprint-through-6x6-terrain-bin',confirmedNull16735:Array.from(confirmedNullKeys16735),bins:after16731.map"""
patch("audit-build",old_audit,new_audit)

p.write_text(s,encoding="utf-8")
print("16740 applied")
