from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_head="<!-- EARTHLINE 16779 — THREE-SUBCELL MINIMUM BEFORE PROPORTIONAL FILL."
new_head="<!-- EARTHLINE 16780 — NESTED FINE-CELL OPPORTUNITY REFINEMENT. After the first Regional swale pass, opportunity-rich 12x12 terrain cells with no corridor midpoint receive bounded 48x48 local DEM refinement before the existing coverage owner reruns. Same slope/water/aquifer/exclusion science, exact jurisdiction containment, water sidecar, ranking semantics and Regional capacity. Real terrain-derived corridors only; no jurisdiction names, synthetic corridors, relaxed science or added capacity. CANDIDATE / NOT ACCEPTED. -->\n"+old_head
if old_head not in s:
    raise SystemExit("16779 header anchor missing")
s=s.replace(old_head,new_head,1)

old_marker="window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16779'"
new_marker="window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16780'"
if s.count(old_marker)!=1:
    raise SystemExit(f"build marker count {s.count(old_marker)}")
s=s.replace(old_marker,new_marker,1)

anchor="""    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);

    /* EARTHLINE 16731 — actual publication coverage is now part of the terrain"""

insert="""    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);

    /* EARTHLINE 16780 — the coarse 6x6 coverage owner can pass while a large
       internal terrain cell has real <=4% opportunity but no corridor midpoint.
       Detect those empty 12x12 cells from terrain itself, refine only a bounded
       set at 48x48, add only real screened candidates, then rerun the same owner. */
    if(!focusMode&&hy&&hy.validityMask16584&&swales&&Array.isArray(swales.features)){
      const fineNX16780=12,fineNY16780=12,channel16780=percentile(hy.acc,.972),fineRows16780=[];
      for(let by16780=0;by16780<fineNY16780;by16780++)for(let bx16780=0;bx16780<fineNX16780;bx16780++){
        const x016780=Math.floor(bx16780*hy.w/fineNX16780),x116780=Math.min(hy.w-1,Math.ceil((bx16780+1)*hy.w/fineNX16780)-1);
        const y016780=Math.floor(by16780*hy.h/fineNY16780),y116780=Math.min(hy.h-1,Math.ceil((by16780+1)*hy.h/fineNY16780)-1);
        let valid16780=0,opportunity16780=0,preferred16780=0;
        for(let y16780=y016780;y16780<=y116780;y16780++)for(let x16780=x016780;x16780<=x116780;x16780++){
          const i16780=y16780*hy.w+x16780;if(hy.validityMask16584[i16780]!==1)continue;
          if(swaleJurisdictionGeometry16539){
            const ll16780=gridLL(hy,x16780,y16780);
            if(!earthlinePointInJurisdiction16539(ll16780,swaleJurisdictionGeometry16539))continue;
          }
          valid16780++;const sp16780=Number(hy.slope[i16780]),ac16780=Number(hy.acc[i16780]);
          if(!Number.isFinite(sp16780)||!Number.isFinite(ac16780)||ac16780>=channel16780)continue;
          if(sp16780>=.05&&sp16780<=4)opportunity16780++;
          if(sp16780>=.20&&sp16780<=4)preferred16780++;
        }
        fineRows16780.push({bx:bx16780,by:by16780,x0:x016780,x1:x116780,y0:y016780,y1:y116780,valid:valid16780,opportunity:opportunity16780,preferred:preferred16780,swales:0});
      }
      const countFineSwales16780=()=>{
        for(const r16780 of fineRows16780)r16780.swales=0;
        for(const f16780 of swales.features||[]){
          const c16780=f16780&&f16780.geometry&&f16780.geometry.type==='LineString'?f16780.geometry.coordinates:null;
          if(!Array.isArray(c16780)||!c16780.length)continue;
          const mid16780=c16780[Math.floor((c16780.length-1)/2)],g16780=llGrid(hy,mid16780);
          if(!g16780||!Number.isFinite(g16780.x)||!Number.isFinite(g16780.y))continue;
          const bx16780=Math.max(0,Math.min(fineNX16780-1,Math.floor(Number(g16780.x)*fineNX16780/Math.max(1,hy.w))));
          const by16780=Math.max(0,Math.min(fineNY16780-1,Math.floor(Number(g16780.y)*fineNY16780/Math.max(1,hy.h))));
          const row16780=fineRows16780.find(r16780=>r16780.bx===bx16780&&r16780.by===by16780);if(row16780)row16780.swales++;
        }
      };
      countFineSwales16780();
      const gapsBefore16780=fineRows16780.filter(r16780=>{
        const ratio16780=r16780.valid?r16780.opportunity/r16780.valid:0;
        return r16780.valid>=20&&r16780.opportunity>=8&&ratio16780>=.18&&r16780.swales===0;
      }).sort((a16780,b16780)=>{
        const ar16780=a16780.opportunity/Math.max(1,a16780.valid),br16780=b16780.opportunity/Math.max(1,b16780.valid);
        const ap16780=a16780.preferred/Math.max(1,a16780.valid),bp16780=b16780.preferred/Math.max(1,b16780.valid);
        return (br16780*100+bp16780*20+b16780.opportunity/8)-(ar16780*100+ap16780*20+a16780.opportunity/8);
      });
      const selected16780=[],parentUse16780=new Map();
      for(const row16780 of gapsBefore16780){
        if(selected16780.length>=8)break;
        const pk16780=Math.floor(row16780.bx/2)+','+Math.floor(row16780.by/2),used16780=parentUse16780.get(pk16780)||0;
        if(used16780>=2)continue;
        selected16780.push(row16780);parentUse16780.set(pk16780,used16780+1);
      }
      let added16780=[],failed16780=[];
      if(selected16780.length){
        const savedLandAudit16780=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584,savedGen16780=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167,start16780=performance.now();
        try{
          const b016780=hy.bounds[0],b116780=hy.bounds[1],b216780=hy.bounds[2],b316780=hy.bounds[3];
          const lon16780=x16780=>b016780+(x16780/(hy.w-1))*(b216780-b016780),lat16780=y16780=>b316780-(y16780/(hy.h-1))*(b316780-b116780);
          const defs16780=selected16780.map((row16780,i16780)=>{
            const pad16780=2,x016780=Math.max(0,row16780.x0-pad16780),x116780=Math.min(hy.w-1,row16780.x1+pad16780),y016780=Math.max(0,row16780.y0-pad16780),y116780=Math.min(hy.h-1,row16780.y1+pad16780);
            return {id:'fine-opportunity-'+(i16780+1),row:row16780,b:[lon16780(x016780),lat16780(y116780),lon16780(x116780),lat16780(y016780)]};
          });
          const settled16780=await Promise.allSettled(defs16780.map(async tile16780=>{
            const d16780=await loadDEM(tile16780.b,48,48,5500,'fine opportunity refinement '+tile16780.id);
            const g16780=earthlineLandValidityMask16584(d16780,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16780;
            const h16780=await hydrology(d16780,g16780.mask);h16780.outsideLandMask16632=g16780.outsideLandMask16632||null;h16780.inlandWaterMask16632=g16780.inlandWaterMask16632||null;
            const ch16780=percentile(h16780.acc,.972),e16780=[];
            for(let y16780=1;y16780<h16780.h-1;y16780++)for(let x16780=1;x16780<h16780.w-1;x16780++){
              const i16780=y16780*h16780.w+x16780;if(g16780.mask[i16780]!==1)continue;
              const sp16780=Number(h16780.slope[i16780]),ac16780=Number(h16780.acc[i16780]),el16780=Number(h16780.elev[i16780]);
              if(Number.isFinite(sp16780)&&sp16780>=.05&&sp16780<=4&&Number.isFinite(ac16780)&&ac16780<ch16780&&Number.isFinite(el16780))e16780.push(el16780);
            }
            e16780.sort((a16780,b16780)=>a16780-b16780);const levels16780=[],seen16780=new Set();
            for(const frac16780 of [.05,.14,.25,.38,.52,.66,.79,.9]){
              if(!e16780.length)break;
              const el16780=e16780[Math.min(e16780.length-1,Math.floor((e16780.length-1)*frac16780))],k16780=Math.round(el16780*2)/2;
              if(!seen16780.has(k16780)){seen16780.add(k16780);levels16780.push(k16780);}
            }
            if(!levels16780.length)return [];
            const c16780=await makeContours(h16780,true,levels16780),s16780=await makeSwales(h16780,c16780,false,swaleJurisdictionGeometry16539,null);window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16780;
            return (s16780.features||[]).map(f16780=>{
              const seg16780=f16780&&f16780.geometry&&f16780.geometry.coordinates||[],mid16780=seg16780[Math.floor((seg16780.length-1)/2)]||null;
              const sp16780=Number(f16780&&f16780.properties&&f16780.properties.slope_pct),score16780=Number(f16780&&f16780.properties&&f16780.properties.score||0);
              if(!mid16780||!Number.isFinite(sp16780)||sp16780<.05||sp16780>4)return null;
              const mg16780=llGrid(hy,mid16780);if(!mg16780||!Number.isFinite(mg16780.x)||!Number.isFinite(mg16780.y))return null;
              const cbx16780=Math.max(0,Math.min(fineNX16780-1,Math.floor(Number(mg16780.x)*fineNX16780/Math.max(1,hy.w))));
              const cby16780=Math.max(0,Math.min(fineNY16780-1,Math.floor(Number(mg16780.y)*fineNY16780/Math.max(1,hy.h))));
              if(cbx16780!==tile16780.row.bx||cby16780!==tile16780.row.by)return null;
              return {segment:seg16780,x:Math.max(1,Math.min(hy.w-2,Math.round(mg16780.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(mg16780.y))),slope:sp16780,acc:0,maxAcc:0,score:Math.max(0,Math.min(1,score16780/100)),confidence:'preferred',minLinePx16632:.75,refined16702:true,fineOpportunity16780:true,tile16702:tile16780.id,tile16780:tile16780.id};
            }).filter(Boolean).sort((a16780,b16780)=>b16780.score-a16780.score).slice(0,6);
          }));
          const results16780=settled16780.map(r16780=>r16780.status==='fulfilled'?r16780.value:[]);
          failed16780=settled16780.map((r16780,i16780)=>r16780.status==='rejected'?{id:defs16780[i16780].id,bx:defs16780[i16780].row.bx,by:defs16780[i16780].row.by,error:String(r16780.reason)}:null).filter(Boolean);
          const occupied16780=new Set((supplementalCandidates16702||[]).map(c16780=>String(c16780.x)+','+String(c16780.y)));
          for(const c16780 of results16780.flat().sort((a16780,b16780)=>b16780.score-a16780.score)){
            const k16780=String(c16780.x)+','+String(c16780.y);if(occupied16780.has(k16780))continue;
            occupied16780.add(k16780);added16780.push(c16780);
          }
          if(added16780.length){
            supplementalCandidates16702.push(...added16780);
            swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);
          }
        }catch(e16780){
          failed16780.push({error:String(e16780)});
        }finally{
          window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16780;window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16780;
        }
        countFineSwales16780();
        const unresolved16780=fineRows16780.filter(r16780=>{
          const ratio16780=r16780.valid?r16780.opportunity/r16780.valid:0;
          return r16780.valid>=20&&r16780.opportunity>=8&&ratio16780>=.18&&r16780.swales===0;
        });
        window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16780={build:'EARTHLINE 16780',grid:'12x12',selected:selected16780.map(r16780=>({bx:r16780.bx,by:r16780.by,valid:r16780.valid,opportunity:r16780.opportunity,preferred:r16780.preferred})),added:added16780.length,failedTiles:failed16780,unresolvedAfter:unresolved16780.map(r16780=>({bx:r16780.bx,by:r16780.by,valid:r16780.valid,opportunity:r16780.opportunity,preferred:r16780.preferred})),elapsedMs:Math.round(performance.now()-start16780),rule:'refine bounded empty 12x12 cells that contain measurable valid <=4% opportunity; add only real screened local-terrain corridors; preserve global science and capacity',at:new Date().toISOString()};
      }else{
        window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16780={build:'EARTHLINE 16780',grid:'12x12',selected:[],added:0,failedTiles:[],unresolvedAfter:[],rule:'no empty fine opportunity cell required nested refinement',at:new Date().toISOString()};
      }
    }

    /* EARTHLINE 16731 — actual publication coverage is now part of the terrain"""

if s.count(anchor)!=1:
    raise SystemExit(f"swale/gap anchor count {s.count(anchor)}")
s=s.replace(anchor,insert,1)

p.write_text(s,encoding="utf-8")
print("16780 applied")
