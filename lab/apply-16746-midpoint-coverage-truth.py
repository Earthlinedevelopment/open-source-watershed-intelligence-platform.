from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name,old,new):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

old1="""      for(const f16731 of swales.features){
        const coords16731=f16731&&f16731.geometry&&f16731.geometry.type==='LineString'?f16731.geometry.coordinates:null;
        if(!Array.isArray(coords16731)||!coords16731.length)continue;
        for(const key16740 of earthlineCoverageBinsForLine16740(coords16731)){
          const parts16740=key16740.split(','),bx16731=Number(parts16740[0]),by16731=Number(parts16740[1]);
          const row16731=bins16731.find(r16731=>r16731.bx===bx16731&&r16731.by===by16731);
          if(row16731)row16731.swales++;
        }
      }"""
new1="""      for(const f16731 of swales.features){
        const coords16731=f16731&&f16731.geometry&&f16731.geometry.type==='LineString'?f16731.geometry.coordinates:null;
        if(!Array.isArray(coords16731)||!coords16731.length)continue;
        const mid16746=coords16731[Math.floor((coords16731.length-1)/2)],g16746=llGrid(hy,mid16746);
        if(!g16746||!Number.isFinite(g16746.x)||!Number.isFinite(g16746.y))continue;
        const bx16746=Math.max(0,Math.min(binsX16731-1,Math.floor(Number(g16746.x)*binsX16731/Math.max(1,hy.w))));
        const by16746=Math.max(0,Math.min(binsY16731-1,Math.floor(Number(g16746.y)*binsY16731/Math.max(1,hy.h))));
        const row16746=bins16731.find(r16731=>r16731.bx===bx16746&&r16731.by===by16746);if(row16746)row16746.swales++;
      }"""
patch("initial midpoint truth",old1,new1)

old2="""      for(const f16731 of swales.features||[]){
        const c16731=f16731&&f16731.geometry&&f16731.geometry.type==='LineString'?f16731.geometry.coordinates:null;if(!Array.isArray(c16731)||!c16731.length)continue;
        for(const key16740 of earthlineCoverageBinsForLine16740(c16731)){
          const parts16740=key16740.split(','),bx16731=Number(parts16740[0]),by16731=Number(parts16740[1]);
          const row16731=after16731.find(r16731=>r16731.bx===bx16731&&r16731.by===by16731);
          if(row16731)row16731.swales++;
        }
      }"""
new2="""      for(const f16731 of swales.features||[]){
        const c16731=f16731&&f16731.geometry&&f16731.geometry.type==='LineString'?f16731.geometry.coordinates:null;if(!Array.isArray(c16731)||!c16731.length)continue;
        const mid16746=c16731[Math.floor((c16731.length-1)/2)],g16746=llGrid(hy,mid16746);if(!g16746||!Number.isFinite(g16746.x)||!Number.isFinite(g16746.y))continue;
        const bx16746=Math.max(0,Math.min(binsX16731-1,Math.floor(Number(g16746.x)*binsX16731/Math.max(1,hy.w)))),by16746=Math.max(0,Math.min(binsY16731-1,Math.floor(Number(g16746.y)*binsY16731/Math.max(1,hy.h))));
        const row16746=after16731.find(r16731=>r16731.bx===bx16746&&r16731.by===by16746);if(row16746)row16746.swales++;
      }"""
patch("post refine midpoint truth",old2,new2)

old3="""          for(const f16741 of swales.features||[]){const c16741=f16741&&f16741.geometry&&f16741.geometry.type==='LineString'?f16741.geometry.coordinates:null;if(!Array.isArray(c16741)||!c16741.length)continue;for(const key16741 of earthlineCoverageBinsForLine16740(c16741)){const parts16741=key16741.split(','),bx16741=Number(parts16741[0]),by16741=Number(parts16741[1]),row16741=after16731.find(r16741=>r16741.bx===bx16741&&r16741.by===by16741);if(row16741)row16741.swales++;}}"""
new3="""          for(const f16741 of swales.features||[]){const c16741=f16741&&f16741.geometry&&f16741.geometry.type==='LineString'?f16741.geometry.coordinates:null;if(!Array.isArray(c16741)||!c16741.length)continue;const mid16746=c16741[Math.floor((c16741.length-1)/2)],g16746=llGrid(hy,mid16746);if(!g16746||!Number.isFinite(g16746.x)||!Number.isFinite(g16746.y))continue;const bx16746=Math.max(0,Math.min(binsX16731-1,Math.floor(Number(g16746.x)*binsX16731/Math.max(1,hy.w)))),by16746=Math.max(0,Math.min(binsY16731-1,Math.floor(Number(g16746.y)*binsY16731/Math.max(1,hy.h)))),row16746=after16731.find(r16741=>r16741.bx===bx16746&&r16741.by===by16746);if(row16746)row16746.swales++;}"""
patch("late midpoint truth",old3,new3)

patch("metric",
"""window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731={build:'EARTHLINE 16741',coverageMetric:'line-footprint-through-6x6-terrain-bin'""",
"""window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731={build:'EARTHLINE 16746',coverageMetric:'corridor-midpoint-in-6x6-terrain-bin'""")

patch("policy",
"""window.EARTHLINE_COVERAGE_POLICY_16733={build:'EARTHLINE 16741',grid:'6x6',jurisdictionAware:!!swaleJurisdictionGeometry16539,maxRefinementBins:18,lateVerificationBins:4,guaranteedCandidatesPerGapTile:2,exactGapCell:true,highResolutionNullAccepted:true,failSoftTransport:true,rule:'a post-selection blank receives one final exact-cell high-resolution verification; valid corridors are added, true scientific nulls are recorded, transport failures remain unresolved'""",
"""window.EARTHLINE_COVERAGE_POLICY_16733={build:'EARTHLINE 16746',grid:'6x6',jurisdictionAware:!!swaleJurisdictionGeometry16539,maxRefinementBins:18,lateVerificationBins:4,guaranteedCandidatesPerGapTile:2,exactGapCell:true,highResolutionNullAccepted:true,failSoftTransport:true,coverageTruth:'corridor midpoint / anchor presence',rule:'a significant opportunity cell is covered only when a corridor is actually anchored in that cell; mere line crossover cannot hide a border gap'""")

p.write_text(s,encoding="utf-8")
print("16746 applied")
