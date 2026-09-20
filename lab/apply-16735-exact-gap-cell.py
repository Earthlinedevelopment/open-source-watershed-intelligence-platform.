from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name,old,new):
    global s
    n=s.count(old)
    if n!=1: raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

patch("gap-cap",
"""      const selected16731=[];for(const gap16731 of gaps16731){if(selected16731.length>=6)break;selected16731.push(gap16731);}
      let added16731=[];""",
"""      const selected16731=[];for(const gap16731 of gaps16731){if(selected16731.length>=12)break;selected16731.push(gap16731);}
      let added16731=[],confirmedNullKeys16735=new Set(),highResCounts16735=[];""")

patch("exact-bin-candidate",
"""              const mg16731=llGrid(hy,mid16731);if(!mg16731||!Number.isFinite(mg16731.x)||!Number.isFinite(mg16731.y))return null;
              return {segment:seg16731,x:Math.max(1,Math.min(hy.w-2,Math.round(mg16731.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(mg16731.y))),slope:sp16731,acc:0,maxAcc:0,score:Math.max(0,Math.min(1,score16731/100)),confidence:'preferred',minLinePx16632:4,refined16702:true,coverageGap16731:true,tile16702:tile16731.id,tile16731:tile16731.id};""",
"""              const mg16731=llGrid(hy,mid16731);if(!mg16731||!Number.isFinite(mg16731.x)||!Number.isFinite(mg16731.y))return null;
              const cbx16735=Math.max(0,Math.min(binsX16731-1,Math.floor(Number(mg16731.x)*binsX16731/Math.max(1,hy.w))));
              const cby16735=Math.max(0,Math.min(binsY16731-1,Math.floor(Number(mg16731.y)*binsY16731/Math.max(1,hy.h))));
              if(cbx16735!==tile16731.row.bx||cby16735!==tile16731.row.by)return null;
              return {segment:seg16731,x:Math.max(1,Math.min(hy.w-2,Math.round(mg16731.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(mg16731.y))),slope:sp16731,acc:0,maxAcc:0,score:Math.max(0,Math.min(1,score16731/100)),confidence:'preferred',minLinePx16632:4,refined16702:true,coverageGap16731:true,tile16702:tile16731.id,tile16731:tile16731.id,gapBx16735:tile16731.row.bx,gapBy16735:tile16731.row.by};""")

patch("high-res-counts",
"""          const occupied16731=new Set((supplementalCandidates16702||[]).map(c16731=>String(c16731.x)+','+String(c16731.y)));
          for(const c16731 of results16731.flat().sort((a16731,b16731)=>b16731.score-a16731.score)){""",
"""          highResCounts16735=tileDefs16731.map((tile16735,i16735)=>({id:tile16735.id,bx:tile16735.row.bx,by:tile16735.row.by,candidates:Array.isArray(results16731[i16735])?results16731[i16735].length:0}));
          confirmedNullKeys16735=new Set(highResCounts16735.filter(r16735=>r16735.candidates===0).map(r16735=>String(r16735.bx)+','+String(r16735.by)));
          const occupied16731=new Set((supplementalCandidates16702||[]).map(c16731=>String(c16731.x)+','+String(c16731.y)));
          for(const c16731 of results16731.flat().sort((a16731,b16731)=>b16731.score-a16731.score)){""")

patch("refine-audit",
"""          window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731={build:'EARTHLINE 16731',before:bins16731.map(r16731=>({bx:r16731.bx,by:r16731.by,valid:r16731.valid,opportunity:r16731.opportunity,preferred:r16731.preferred,swales:r16731.swales})),selected:selected16731.map(r16731=>({bx:r16731.bx,by:r16731.by,valid:r16731.valid,opportunity:r16731.opportunity,preferred:r16731.preferred})),added:added16731.length,elapsedMs:Math.round(performance.now()-start16731),rule:'a jurisdiction-valid 6x6 terrain bin with >=3.5% <=4% opportunity and zero selected corridors is refined regardless of geography',at:new Date().toISOString()};""",
"""          window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731={build:'EARTHLINE 16735',before:bins16731.map(r16731=>({bx:r16731.bx,by:r16731.by,valid:r16731.valid,opportunity:r16731.opportunity,preferred:r16731.preferred,swales:r16731.swales})),selected:selected16731.map(r16731=>({bx:r16731.bx,by:r16731.by,valid:r16731.valid,opportunity:r16731.opportunity,preferred:r16731.preferred})),highResCounts16735,confirmedNull16735:Array.from(confirmedNullKeys16735),added:added16731.length,elapsedMs:Math.round(performance.now()-start16731),rule:'refined candidates must land inside the exact triggering 6x6 jurisdiction cell; a zero-candidate high-resolution cell is recorded as a scientific null, not force-filled',at:new Date().toISOString()};""")

patch("final-unresolved",
"""      const unresolved16731=after16731.filter(r16731=>r16731.valid>=45&&r16731.opportunity>=8&&(r16731.opportunity/Math.max(1,r16731.valid))>=.035&&r16731.swales===0);""",
"""      const unresolved16731=after16731.filter(r16731=>r16731.valid>=45&&r16731.opportunity>=8&&(r16731.opportunity/Math.max(1,r16731.valid))>=.035&&r16731.swales===0&&!confirmedNullKeys16735.has(String(r16731.bx)+','+String(r16731.by)));""")

patch("policy",
"""window.EARTHLINE_COVERAGE_POLICY_16733={build:'EARTHLINE 16733',grid:'6x6',jurisdictionAware:!!swaleJurisdictionGeometry16539,maxRefinementBins:6,guaranteedCandidatesPerGapTile:2,rule:'major blank terrain is a failure only where the selected jurisdiction itself contains measurable <=4% opportunity',at:new Date().toISOString()};""",
"""window.EARTHLINE_COVERAGE_POLICY_16733={build:'EARTHLINE 16735',grid:'6x6',jurisdictionAware:!!swaleJurisdictionGeometry16539,maxRefinementBins:12,guaranteedCandidatesPerGapTile:2,exactGapCell:true,highResolutionNullAccepted:true,rule:'major blank terrain is resolved only by an exact-cell refined corridor or by high-resolution evidence that the cell has no valid corridor',at:new Date().toISOString()};""")

patch("audit-build",
"""window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731={build:'EARTHLINE 16733',bins:after16731.map""",
"""window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731={build:'EARTHLINE 16735',confirmedNull16735:Array.from(confirmedNullKeys16735),bins:after16731.map""")

p.write_text(s,encoding="utf-8")
print("16735 applied")
