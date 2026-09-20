from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name, old, new):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

old="""      const unresolved16731=after16731.filter(r16731=>r16731.valid>=45&&r16731.opportunity>=8&&(r16731.opportunity/Math.max(1,r16731.valid))>=.035&&r16731.swales===0&&!confirmedNullKeys16735.has(String(r16731.bx)+','+String(r16731.by)));
      window.EARTHLINE_COVERAGE_POLICY_16733={build:'EARTHLINE 16738',grid:'6x6',jurisdictionAware:!!swaleJurisdictionGeometry16539,maxRefinementBins:18,guaranteedCandidatesPerGapTile:2,exactGapCell:true,highResolutionNullAccepted:true,failSoftTransport:true,rule:'major blank terrain is resolved only by an exact-cell refined corridor or high-resolution scientific null; transport failures remain unresolved and cannot erase successful sibling tiles',at:new Date().toISOString()};"""

new="""      let unresolved16731=after16731.filter(r16731=>r16731.valid>=45&&r16731.opportunity>=8&&(r16731.opportunity/Math.max(1,r16731.valid))>=.035&&r16731.swales===0&&!confirmedNullKeys16735.has(String(r16731.bx)+','+String(r16731.by)));
      /* EARTHLINE 16741 — one last high-resolution verification is allowed only for
         bins that became blank after the first refinement/selection rerun. This
         prevents a newly displaced border bin from surviving the final audit.
         A zero-candidate result is a scientific null; a transport failure remains a failure. */
      if(unresolved16731.length){
        const lateBins16741=unresolved16731.slice(0,4),lateStart16741=performance.now();
        const savedLandAudit16741=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584,savedGen16741=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167;
        try{
          const b016741=hy.bounds[0],b116741=hy.bounds[1],b216741=hy.bounds[2],b316741=hy.bounds[3];
          const lon16741=x16741=>b016741+(x16741/(hy.w-1))*(b216741-b016741),lat16741=y16741=>b316741-(y16741/(hy.h-1))*(b316741-b116741);
          const defs16741=lateBins16741.map((row16741,i16741)=>{
            const pad16741=3,x016741=Math.max(0,row16741.x0-pad16741),x116741=Math.min(hy.w-1,row16741.x1+pad16741),y016741=Math.max(0,row16741.y0-pad16741),y116741=Math.min(hy.h-1,row16741.y1+pad16741);
            return {id:'late-gap-'+(i16741+1),row:row16741,b:[lon16741(x016741),lat16741(y116741),lon16741(x116741),lat16741(y016741)]};
          });
          const settled16741=await Promise.allSettled(defs16741.map(async tile16741=>{
            const d16741=await loadDEM(tile16741.b,96,96,8000,'late coverage-gap verification '+tile16741.id);
            const g16741=earthlineLandValidityMask16584(d16741,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16741;
            const h16741=await hydrology(d16741,g16741.mask);h16741.outsideLandMask16632=g16741.outsideLandMask16632||null;h16741.inlandWaterMask16632=g16741.inlandWaterMask16632||null;
            const ch16741=percentile(h16741.acc,.972),e16741=[];
            for(let y16741=1;y16741<h16741.h-1;y16741++)for(let x16741=1;x16741<h16741.w-1;x16741++){
              const i16741=y16741*h16741.w+x16741;if(g16741.mask[i16741]!==1)continue;
              const sp16741=Number(h16741.slope[i16741]),ac16741=Number(h16741.acc[i16741]),el16741=Number(h16741.elev[i16741]);
              if(Number.isFinite(sp16741)&&sp16741>=.05&&sp16741<=4&&Number.isFinite(ac16741)&&ac16741<ch16741&&Number.isFinite(el16741))e16741.push(el16741);
            }
            e16741.sort((a16741,b16741)=>a16741-b16741);const levels16741=[],seen16741=new Set();
            for(const frac16741 of [.04,.10,.18,.28,.40,.53,.66,.78,.88,.95]){
              if(!e16741.length)break;const el16741=e16741[Math.min(e16741.length-1,Math.floor((e16741.length-1)*frac16741))],k16741=Math.round(el16741*2)/2;
              if(!seen16741.has(k16741)){seen16741.add(k16741);levels16741.push(k16741);}
            }
            if(!levels16741.length)return [];
            const c16741=await makeContours(h16741,true,levels16741),s16741=await makeSwales(h16741,c16741,false,swaleJurisdictionGeometry16539,null);window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16741;
            return (s16741.features||[]).map(f16741=>{
              const seg16741=f16741&&f16741.geometry&&f16741.geometry.coordinates||[],mid16741=seg16741[Math.floor((seg16741.length-1)/2)]||null,sp16741=Number(f16741&&f16741.properties&&f16741.properties.slope_pct),score16741=Number(f16741&&f16741.properties&&f16741.properties.score||0);
              if(!mid16741||!Number.isFinite(sp16741)||sp16741<.05||sp16741>4)return null;
              const mg16741=llGrid(hy,mid16741);if(!mg16741||!Number.isFinite(mg16741.x)||!Number.isFinite(mg16741.y))return null;
              const cbx16741=Math.max(0,Math.min(binsX16731-1,Math.floor(Number(mg16741.x)*binsX16731/Math.max(1,hy.w)))),cby16741=Math.max(0,Math.min(binsY16731-1,Math.floor(Number(mg16741.y)*binsY16731/Math.max(1,hy.h))));
              if(cbx16741!==tile16741.row.bx||cby16741!==tile16741.row.by)return null;
              return {segment:seg16741,x:Math.max(1,Math.min(hy.w-2,Math.round(mg16741.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(mg16741.y))),slope:sp16741,acc:0,maxAcc:0,score:Math.max(0,Math.min(1,score16741/100)),confidence:'preferred',minLinePx16632:.75,refined16702:true,coverageGap16731:true,lateGap16741:true,tile16702:tile16741.id,tile16731:tile16741.id};
            }).filter(Boolean).sort((a16741,b16741)=>b16741.score-a16741.score).slice(0,10);
          }));
          const results16741=settled16741.map(r16741=>r16741.status==='fulfilled'?r16741.value:[]);
          const failures16741=settled16741.map((r16741,i16741)=>r16741.status==='rejected'?{id:defs16741[i16741].id,bx:defs16741[i16741].row.bx,by:defs16741[i16741].row.by,error:String(r16741.reason)}:null).filter(Boolean);
          const failedKeys16741=new Set(failures16741.map(r16741=>r16741.bx+','+r16741.by));
          const nulls16741=[];
          defs16741.forEach((d16741,i16741)=>{if(!failedKeys16741.has(d16741.row.bx+','+d16741.row.by)&&(!Array.isArray(results16741[i16741])||results16741[i16741].length===0)){const k16741=d16741.row.bx+','+d16741.row.by;confirmedNullKeys16735.add(k16741);nulls16741.push(k16741);}});
          const occupied16741=new Set((supplementalCandidates16702||[]).map(c16741=>String(c16741.x)+','+String(c16741.y))),added16741=[];
          for(const c16741 of results16741.flat().sort((a16741,b16741)=>b16741.score-a16741.score)){const k16741=String(c16741.x)+','+String(c16741.y);if(occupied16741.has(k16741))continue;occupied16741.add(k16741);added16741.push(c16741);}
          if(added16741.length){supplementalCandidates16702.push(...added16741);swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);}
          for(const r16741 of after16731)r16741.swales=0;
          for(const f16741 of swales.features||[]){const c16741=f16741&&f16741.geometry&&f16741.geometry.type==='LineString'?f16741.geometry.coordinates:null;if(!Array.isArray(c16741)||!c16741.length)continue;for(const key16741 of earthlineCoverageBinsForLine16740(c16741)){const parts16741=key16741.split(','),bx16741=Number(parts16741[0]),by16741=Number(parts16741[1]),row16741=after16731.find(r16741=>r16741.bx===bx16741&&r16741.by===by16741);if(row16741)row16741.swales++;}}
          unresolved16731=after16731.filter(r16731=>r16731.valid>=45&&r16731.opportunity>=8&&(r16731.opportunity/Math.max(1,r16731.valid))>=.035&&r16731.swales===0&&!confirmedNullKeys16735.has(String(r16731.bx)+','+String(r16731.by)));
          window.EARTHLINE_LATE_GAP_REFINEMENT_16741={build:'EARTHLINE 16741',selected:defs16741.map(d16741=>({bx:d16741.row.bx,by:d16741.row.by})),added:added16741.length,scientificNulls:nulls16741,failedTiles:failures16741,elapsedMs:Math.round(performance.now()-lateStart16741),unresolvedAfter:unresolved16731.map(r16731=>({bx:r16731.bx,by:r16731.by})),at:new Date().toISOString()};
        }catch(e16741){window.EARTHLINE_LATE_GAP_REFINEMENT_16741={build:'EARTHLINE 16741',error:String(e16741),at:new Date().toISOString()};}
        finally{window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16741;window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16741;}
      }
      window.EARTHLINE_COVERAGE_POLICY_16733={build:'EARTHLINE 16741',grid:'6x6',jurisdictionAware:!!swaleJurisdictionGeometry16539,maxRefinementBins:18,lateVerificationBins:4,guaranteedCandidatesPerGapTile:2,exactGapCell:true,highResolutionNullAccepted:true,failSoftTransport:true,rule:'a post-selection blank receives one final exact-cell high-resolution verification; valid corridors are added, true scientific nulls are recorded, transport failures remain unresolved',at:new Date().toISOString()};"""

patch("late-gap",old,new)

old_audit="""window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731={build:'EARTHLINE 16740',coverageMetric:'line-footprint-through-6x6-terrain-bin',confirmedNull16735:Array.from(confirmedNullKeys16735),bins:after16731.map"""
new_audit="""window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731={build:'EARTHLINE 16741',coverageMetric:'line-footprint-through-6x6-terrain-bin',confirmedNull16735:Array.from(confirmedNullKeys16735),bins:after16731.map"""
patch("audit-build",old_audit,new_audit)

p.write_text(s,encoding="utf-8")
print("16741 applied")
