from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);
    const priorityPreviewEnabled16329=false;"""

new="""    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);

    /* EARTHLINE 16731 — actual publication coverage is now part of the terrain
       sufficiency test. A large valid terrain bin with measurable <=4% opportunity
       and zero selected corridors is unresolved, regardless of state or coast.
       Refine only those empty opportunity bins, then rerun the same swale owner. */
    if(!focusMode&&hy&&hy.validityMask16584&&swales&&Array.isArray(swales.features)){
      const binsX16731=4,binsY16731=4,channel16731=percentile(hy.acc,.972);
      const bins16731=[];
      for(let by16731=0;by16731<binsY16731;by16731++)for(let bx16731=0;bx16731<binsX16731;bx16731++){
        const x016731=Math.floor(bx16731*hy.w/binsX16731),x116731=Math.min(hy.w-1,Math.ceil((bx16731+1)*hy.w/binsX16731)-1);
        const y016731=Math.floor(by16731*hy.h/binsY16731),y116731=Math.min(hy.h-1,Math.ceil((by16731+1)*hy.h/binsY16731)-1);
        let valid16731=0,opportunity16731=0,preferred16731=0;
        for(let y16731=y016731;y16731<=y116731;y16731++)for(let x16731=x016731;x16731<=x116731;x16731++){
          const i16731=y16731*hy.w+x16731;if(hy.validityMask16584[i16731]!==1)continue;
          valid16731++;const sp16731=Number(hy.slope[i16731]),ac16731=Number(hy.acc[i16731]);
          if(!Number.isFinite(sp16731)||!Number.isFinite(ac16731)||ac16731>=channel16731)continue;
          if(sp16731>=.05&&sp16731<=4)opportunity16731++;
          if(sp16731>=.20&&sp16731<=4)preferred16731++;
        }
        bins16731.push({bx:bx16731,by:by16731,x0:x016731,x1:x116731,y0:y016731,y1:y116731,valid:valid16731,opportunity:opportunity16731,preferred:preferred16731,swales:0});
      }
      for(const f16731 of swales.features){
        const coords16731=f16731&&f16731.geometry&&f16731.geometry.type==='LineString'?f16731.geometry.coordinates:null;
        if(!Array.isArray(coords16731)||!coords16731.length)continue;
        const mid16731=coords16731[Math.floor((coords16731.length-1)/2)],g16731=llGrid(hy,mid16731);
        if(!g16731||!Number.isFinite(g16731.x)||!Number.isFinite(g16731.y))continue;
        const bx16731=Math.max(0,Math.min(binsX16731-1,Math.floor(Number(g16731.x)*binsX16731/Math.max(1,hy.w))));
        const by16731=Math.max(0,Math.min(binsY16731-1,Math.floor(Number(g16731.y)*binsY16731/Math.max(1,hy.h))));
        const row16731=bins16731.find(r16731=>r16731.bx===bx16731&&r16731.by===by16731);if(row16731)row16731.swales++;
      }
      const gaps16731=bins16731.filter(r16731=>{
        const ratio16731=r16731.valid?r16731.opportunity/r16731.valid:0;
        return r16731.valid>=80&&r16731.opportunity>=7&&ratio16731>=.012&&r16731.swales===0;
      }).sort((a16731,b16731)=>{
        const pa16731=(a16731.opportunity/Math.max(1,a16731.valid))*100+a16731.opportunity/20;
        const pb16731=(b16731.opportunity/Math.max(1,b16731.valid))*100+b16731.opportunity/20;
        return pb16731-pa16731;
      });
      const selected16731=[];for(const gap16731 of gaps16731){if(selected16731.length>=3)break;selected16731.push(gap16731);}
      let added16731=[];
      if(selected16731.length){
        const savedLandAudit16731=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584,savedGen16731=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167,start16731=performance.now();
        try{
          const b016731=hy.bounds[0],b116731=hy.bounds[1],b216731=hy.bounds[2],b316731=hy.bounds[3];
          const lon16731=x16731=>b016731+(x16731/(hy.w-1))*(b216731-b016731),lat16731=y16731=>b316731-(y16731/(hy.h-1))*(b316731-b116731);
          const tileDefs16731=selected16731.map((row16731,idx16731)=>{
            const pad16731=3,x016731=Math.max(0,row16731.x0-pad16731),x116731=Math.min(hy.w-1,row16731.x1+pad16731),y016731=Math.max(0,row16731.y0-pad16731),y116731=Math.min(hy.h-1,row16731.y1+pad16731);
            return {id:'coverage-gap-'+(idx16731+1),row:row16731,b:[lon16731(x016731),lat16731(y116731),lon16731(x116731),lat16731(y016731)]};
          });
          const results16731=await Promise.all(tileDefs16731.map(async tile16731=>{
            const d16731=await loadDEM(tile16731.b,96,96,6000,'coverage-gap refinement '+tile16731.id);
            const g16731=earthlineLandValidityMask16584(d16731,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16731;
            const h16731=await hydrology(d16731,g16731.mask);h16731.outsideLandMask16632=g16731.outsideLandMask16632||null;h16731.inlandWaterMask16632=g16731.inlandWaterMask16632||null;
            const ch16731=percentile(h16731.acc,.972),e16731=[];
            for(let y16731=1;y16731<h16731.h-1;y16731++)for(let x16731=1;x16731<h16731.w-1;x16731++){
              const i16731=y16731*h16731.w+x16731;if(g16731.mask[i16731]!==1)continue;
              const sp16731=Number(h16731.slope[i16731]),ac16731=Number(h16731.acc[i16731]),el16731=Number(h16731.elev[i16731]);
              if(Number.isFinite(sp16731)&&sp16731>=.05&&sp16731<=4&&Number.isFinite(ac16731)&&ac16731<ch16731&&Number.isFinite(el16731))e16731.push(el16731);
            }
            e16731.sort((a16731,b16731)=>a16731-b16731);const levels16731=[],seen16731=new Set();
            for(const frac16731 of [.04,.10,.18,.28,.40,.53,.66,.78,.88,.95]){
              if(!e16731.length)break;const el16731=e16731[Math.min(e16731.length-1,Math.floor((e16731.length-1)*frac16731))],k16731=Math.round(el16731*2)/2;
              if(!seen16731.has(k16731)){seen16731.add(k16731);levels16731.push(k16731);}
            }
            if(!levels16731.length)return [];
            const c16731=await makeContours(h16731,true,levels16731),s16731=await makeSwales(h16731,c16731,false,swaleJurisdictionGeometry16539,null);window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16731;
            return (s16731.features||[]).map(f16731=>{
              const seg16731=f16731&&f16731.geometry&&f16731.geometry.coordinates||[],mid16731=seg16731[Math.floor((seg16731.length-1)/2)]||null,sp16731=Number(f16731&&f16731.properties&&f16731.properties.slope_pct),score16731=Number(f16731&&f16731.properties&&f16731.properties.score||0);
              if(!mid16731||!Number.isFinite(sp16731)||sp16731<.05||sp16731>4)return null;
              const mg16731=llGrid(hy,mid16731);if(!mg16731||!Number.isFinite(mg16731.x)||!Number.isFinite(mg16731.y))return null;
              return {segment:seg16731,x:Math.max(1,Math.min(hy.w-2,Math.round(mg16731.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(mg16731.y))),slope:sp16731,acc:0,maxAcc:0,score:Math.max(0,Math.min(1,score16731/100)),confidence:'preferred',minLinePx16632:4,refined16702:true,coverageGap16731:true,tile16702:tile16731.id,tile16731:tile16731.id};
            }).filter(Boolean).sort((a16731,b16731)=>b16731.score-a16731.score).slice(0,10);
          }));
          const occupied16731=new Set((supplementalCandidates16702||[]).map(c16731=>String(c16731.x)+','+String(c16731.y)));
          for(const c16731 of results16731.flat().sort((a16731,b16731)=>b16731.score-a16731.score)){
            const k16731=String(c16731.x)+','+String(c16731.y);if(occupied16731.has(k16731))continue;occupied16731.add(k16731);added16731.push(c16731);
          }
          if(added16731.length){
            supplementalCandidates16702.push(...added16731);
            swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);
          }
          window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731={build:'EARTHLINE 16731',before:bins16731.map(r16731=>({bx:r16731.bx,by:r16731.by,valid:r16731.valid,opportunity:r16731.opportunity,preferred:r16731.preferred,swales:r16731.swales})),selected:selected16731.map(r16731=>({bx:r16731.bx,by:r16731.by,valid:r16731.valid,opportunity:r16731.opportunity,preferred:r16731.preferred})),added:added16731.length,elapsedMs:Math.round(performance.now()-start16731),rule:'a valid 4x4 terrain bin with >=1.2% <=4% opportunity and zero selected corridors is refined regardless of geography',at:new Date().toISOString()};
        }catch(e16731){window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731={build:'EARTHLINE 16731',error:String(e16731),at:new Date().toISOString()};}
        finally{window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16731;window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16731;}
      }else{
        window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731={build:'EARTHLINE 16731',before:bins16731.map(r16731=>({bx:r16731.bx,by:r16731.by,valid:r16731.valid,opportunity:r16731.opportunity,preferred:r16731.preferred,swales:r16731.swales})),selected:[],added:0,rule:'no unresolved opportunity bin detected',at:new Date().toISOString()};
      }
      /* Final objective coverage audit after any refinement. */
      const after16731=bins16731.map(r16731=>Object.assign({},r16731,{swales:0}));
      for(const f16731 of swales.features||[]){
        const c16731=f16731&&f16731.geometry&&f16731.geometry.type==='LineString'?f16731.geometry.coordinates:null;if(!Array.isArray(c16731)||!c16731.length)continue;
        const mid16731=c16731[Math.floor((c16731.length-1)/2)],g16731=llGrid(hy,mid16731);if(!g16731||!Number.isFinite(g16731.x)||!Number.isFinite(g16731.y))continue;
        const bx16731=Math.max(0,Math.min(binsX16731-1,Math.floor(Number(g16731.x)*binsX16731/Math.max(1,hy.w)))),by16731=Math.max(0,Math.min(binsY16731-1,Math.floor(Number(g16731.y)*binsY16731/Math.max(1,hy.h))));
        const row16731=after16731.find(r16731=>r16731.bx===bx16731&&r16731.by===by16731);if(row16731)row16731.swales++;
      }
      const unresolved16731=after16731.filter(r16731=>r16731.valid>=80&&r16731.opportunity>=7&&(r16731.opportunity/Math.max(1,r16731.valid))>=.012&&r16731.swales===0);
      window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731={build:'EARTHLINE 16731',bins:after16731.map(r16731=>({bx:r16731.bx,by:r16731.by,valid:r16731.valid,opportunity:r16731.opportunity,preferred:r16731.preferred,swales:r16731.swales})),unresolved:unresolved16731.map(r16731=>({bx:r16731.bx,by:r16731.by,valid:r16731.valid,opportunity:r16731.opportunity,preferred:r16731.preferred})),passed:unresolved16731.length===0,at:new Date().toISOString()};
    }
    const priorityPreviewEnabled16329=false;"""

n=s.count(old)
if n!=1: raise SystemExit(f"16731 anchor expected once, found {n}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("16731 applied")
