from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name, old, new):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

patch("gap-cap",
"""      const selected16731=[];for(const gap16731 of gaps16731){if(selected16731.length>=12)break;selected16731.push(gap16731);}""",
"""      const selected16731=[];for(const gap16731 of gaps16731){if(selected16731.length>=18)break;selected16731.push(gap16731);}""")

patch("settled-open",
"""          const results16731=await Promise.all(tileDefs16731.map(async tile16731=>{""",
"""          const settled16738=await Promise.allSettled(tileDefs16731.map(async tile16731=>{""")

patch("tile-timeout",
"""            const d16731=await loadDEM(tile16731.b,96,96,6000,'coverage-gap refinement '+tile16731.id);""",
"""            const d16731=await loadDEM(tile16731.b,96,96,8000,'coverage-gap refinement '+tile16731.id);""")

old_close="""            }).filter(Boolean).sort((a16731,b16731)=>b16731.score-a16731.score).slice(0,10);
          }));
          highResCounts16735=tileDefs16731.map((tile16735,i16735)=>({id:tile16735.id,bx:tile16735.row.bx,by:tile16735.row.by,candidates:Array.isArray(results16731[i16735])?results16731[i16735].length:0}));
          confirmedNullKeys16735=new Set(highResCounts16735.filter(r16735=>r16735.candidates===0).map(r16735=>String(r16735.bx)+','+String(r16735.by)));"""
new_close="""            }).filter(Boolean).sort((a16731,b16731)=>b16731.score-a16731.score).slice(0,10);
          }));
          const results16731=settled16738.map(r16738=>r16738.status==='fulfilled'?r16738.value:[]);
          const failedTiles16738=settled16738.map((r16738,i16738)=>r16738.status==='rejected'?{id:tileDefs16731[i16738].id,bx:tileDefs16731[i16738].row.bx,by:tileDefs16731[i16738].row.by,error:String(r16738.reason)}:null).filter(Boolean);
          const failedTileKeys16738=new Set(failedTiles16738.map(r16738=>String(r16738.bx)+','+String(r16738.by)));
          highResCounts16735=tileDefs16731.map((tile16735,i16735)=>({id:tile16735.id,bx:tile16735.row.bx,by:tile16735.row.by,candidates:Array.isArray(results16731[i16735])?results16731[i16735].length:0,failed:failedTileKeys16738.has(String(tile16735.row.bx)+','+String(tile16735.row.by))}));
          confirmedNullKeys16735=new Set(highResCounts16735.filter(r16735=>r16735.candidates===0&&!r16735.failed).map(r16735=>String(r16735.bx)+','+String(r16735.by)));"""
patch("settled-close",old_close,new_close)

old_audit="""          window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731={build:'EARTHLINE 16735',before:bins16731.map(r16731=>({bx:r16731.bx,by:r16731.by,valid:r16731.valid,opportunity:r16731.opportunity,preferred:r16731.preferred,swales:r16731.swales})),selected:selected16731.map(r16731=>({bx:r16731.bx,by:r16731.by,valid:r16731.valid,opportunity:r16731.opportunity,preferred:r16731.preferred})),highResCounts16735,confirmedNull16735:Array.from(confirmedNullKeys16735),added:added16731.length,elapsedMs:Math.round(performance.now()-start16731),rule:'refined candidates must land inside the exact triggering 6x6 jurisdiction cell; a zero-candidate high-resolution cell is recorded as a scientific null, not force-filled',at:new Date().toISOString()};"""
new_audit="""          window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731={build:'EARTHLINE 16738',before:bins16731.map(r16731=>({bx:r16731.bx,by:r16731.by,valid:r16731.valid,opportunity:r16731.opportunity,preferred:r16731.preferred,swales:r16731.swales})),selected:selected16731.map(r16731=>({bx:r16731.bx,by:r16731.by,valid:r16731.valid,opportunity:r16731.opportunity,preferred:r16731.preferred})),highResCounts16735,failedTiles16738,confirmedNull16735:Array.from(confirmedNullKeys16735),added:added16731.length,elapsedMs:Math.round(performance.now()-start16731),rule:'refine up to 18 exact jurisdiction cells; one tile transport failure cannot discard successful cells and is never mislabeled as a scientific null',at:new Date().toISOString()};"""
patch("audit-success",old_audit,new_audit)

old_policy="""window.EARTHLINE_COVERAGE_POLICY_16733={build:'EARTHLINE 16735',grid:'6x6',jurisdictionAware:!!swaleJurisdictionGeometry16539,maxRefinementBins:12,guaranteedCandidatesPerGapTile:2,exactGapCell:true,highResolutionNullAccepted:true,rule:'major blank terrain is resolved only by an exact-cell refined corridor or by high-resolution evidence that the cell has no valid corridor',at:new Date().toISOString()};"""
new_policy="""window.EARTHLINE_COVERAGE_POLICY_16733={build:'EARTHLINE 16738',grid:'6x6',jurisdictionAware:!!swaleJurisdictionGeometry16539,maxRefinementBins:18,guaranteedCandidatesPerGapTile:2,exactGapCell:true,highResolutionNullAccepted:true,failSoftTransport:true,rule:'major blank terrain is resolved only by an exact-cell refined corridor or high-resolution scientific null; transport failures remain unresolved and cannot erase successful sibling tiles',at:new Date().toISOString()};"""
patch("policy",old_policy,new_policy)

p.write_text(s,encoding="utf-8")
print("16738 applied")
