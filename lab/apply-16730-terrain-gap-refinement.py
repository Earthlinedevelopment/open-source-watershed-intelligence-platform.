from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);"""

new="""    /* EARTHLINE 16730 — statewide 96x96 terrain can under-resolve broad low-relief
       land even when another part of the same state supplies plenty of preferred
       candidates. Detect that from terrain itself, not from state/coast names, and
       add a bounded high-resolution candidate pass only in starved terrain cells. */
    if(!focusMode&&hy&&hy.validityMask16584){
      const channel16730=percentile(hy.acc,.972),tilesX16730=4,tilesY16730=4,binRows16730=[];
      for(let by16730=0;by16730<tilesY16730;by16730++)for(let bx16730=0;bx16730<tilesX16730;bx16730++){
        const x016730=Math.floor(bx16730*hy.w/tilesX16730),x116730=Math.min(hy.w-1,Math.ceil((bx16730+1)*hy.w/tilesX16730)-1);
        const y016730=Math.floor(by16730*hy.h/tilesY16730),y116730=Math.min(hy.h-1,Math.ceil((by16730+1)*hy.h/tilesY16730)-1);
        let valid16730=0,preferred16730=0,relaxed16730=0;const elev16730=[];
        for(let y16730=y016730;y16730<=y116730;y16730++)for(let x16730=x016730;x16730<=x116730;x16730++){
          const i16730=y16730*hy.w+x16730;if(hy.validityMask16584[i16730]!==1)continue;
          valid16730++;const sp16730=Number(hy.slope[i16730]),ac16730=Number(hy.acc[i16730]),el16730=Number(hy.elev[i16730]);
          if(Number.isFinite(el16730))elev16730.push(el16730);
          if(!Number.isFinite(sp16730)||!Number.isFinite(ac16730)||ac16730>=channel16730)continue;
          if(sp16730>=.20&&sp16730<=4)preferred16730++;
          if(sp16730>=.05&&sp16730<=4)relaxed16730++;
        }
        elev16730.sort((a16730,b16730)=>a16730-b16730);
        const q16730=f16730=>elev16730.length?elev16730[Math.max(0,Math.min(elev16730.length-1,Math.floor((elev16730.length-1)*f16730)))]:NaN;
        const relief16730=Number.isFinite(q16730(.9))&&Number.isFinite(q16730(.1))?q16730(.9)-q16730(.1):Infinity;
        const preferredRatio16730=valid16730?preferred16730/valid16730:1,relaxedRatio16730=valid16730?relaxed16730/valid16730:0;
        const starved16730=valid16730>=90&&preferredRatio16730<=.035&&relaxed16730>=4&&relief16730>=2&&relief16730<=450;
        binRows16730.push({bx:bx16730,by:by16730,x0:x016730,x1:x116730,y0:y016730,y1:y116730,valid:valid16730,preferred:preferred16730,relaxed:relaxed16730,preferredRatio:preferredRatio16730,relaxedRatio:relaxedRatio16730,relief:relief16730,starved:starved16730,priority:starved16730?(valid16730*(.05+relaxedRatio16730)/(preferred16730+1)):0});
      }
      const candidates16730=binRows16730.filter(r16730=>r16730.starved).sort((a16730,b16730)=>b16730.priority-a16730.priority),chosenBins16730=[];
      for(const row16730 of candidates16730){
        if(chosenBins16730.length>=4)break;
        if(chosenBins16730.some(p16730=>Math.hypot(p16730.bx-row16730.bx,p16730.by-row16730.by)<1.1))continue;
        chosenBins16730.push(row16730);
      }
      if(chosenBins16730.length){
        const savedLandAudit16730=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584,savedGen16730=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167,start16730=performance.now();
        try{
          const b016730=hy.bounds[0],b116730=hy.bounds[1],b216730=hy.bounds[2],b316730=hy.bounds[3],lon16730=x16730=>b016730+(x16730/(hy.w-1))*(b216730-b016730),lat16730=y16730=>b316730-(y16730/(hy.h-1))*(b316730-b116730);
          const tileDefs16730=chosenBins16730.map((row16730,idx16730)=>{
            const pad16730=3,x016730=Math.max(0,row16730.x0-pad16730),x116730=Math.min(hy.w-1,row16730.x1+pad16730),y016730=Math.max(0,row16730.y0-pad16730),y116730=Math.min(hy.h-1,row16730.y1+pad16730);
            return {id:'terrain-gap-'+(idx16730+1),row:row16730,b:[lon16730(x016730),lat16730(y116730),lon16730(x116730),lat16730(y016730)]};
          });
          const tileResults16730=await Promise.all(tileDefs16730.map(async tile16730=>{
            const d16730=await loadDEM(tile16730.b,96,96,6000,'terrain-gap refinement '+tile16730.id),g16730=earthlineLandValidityMask16584(d16730,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16730;
            const h16730=await hydrology(d16730,g16730.mask);h16730.outsideLandMask16632=g16730.outsideLandMask16632||null;h16730.inlandWaterMask16632=g16730.inlandWaterMask16632||null;
            const ch16730=percentile(h16730.acc,.972),e16730=[];
            for(let y16730=1;y16730<h16730.h-1;y16730++)for(let x16730=1;x16730<h16730.w-1;x16730++){
              const i16730=y16730*h16730.w+x16730;if(g16730.mask[i16730]!==1)continue;
              const sp16730=Number(h16730.slope[i16730]),ac16730=Number(h16730.acc[i16730]),el16730=Number(h16730.elev[i16730]);
              if(Number.isFinite(sp16730)&&sp16730>=.05&&sp16730<=4&&Number.isFinite(ac16730)&&ac16730<ch16730&&Number.isFinite(el16730))e16730.push(el16730);
            }
            e16730.sort((a16730,b16730)=>a16730-b16730);const levels16730=[],seen16730=new Set();
            for(const frac16730 of [.05,.14,.25,.38,.52,.66,.79,.9]){
              if(!e16730.length)break;const el16730=e16730[Math.min(e16730.length-1,Math.floor((e16730.length-1)*frac16730))],k16730=Math.round(el16730*2)/2;
              if(!seen16730.has(k16730)){seen16730.add(k16730);levels16730.push(k16730);}
            }
            if(!levels16730.length)return [];
            const c16730=await makeContours(h16730,true,levels16730),s16730=await makeSwales(h16730,c16730,false,swaleJurisdictionGeometry16539,null);window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16730;
            return (s16730.features||[]).map(f16730=>{
              const seg16730=f16730.geometry&&f16730.geometry.coordinates||[],mid16730=seg16730[Math.floor((seg16730.length-1)/2)]||null,sp16730=Number(f16730.properties&&f16730.properties.slope_pct),score16730=Number(f16730.properties&&f16730.properties.score||0);
              if(!mid16730||!Number.isFinite(sp16730)||sp16730<.05||sp16730>4)return null;
              const mg16730=llGrid(hy,mid16730);if(!mg16730||!Number.isFinite(mg16730.x)||!Number.isFinite(mg16730.y))return null;
              return {segment:seg16730,x:Math.max(1,Math.min(hy.w-2,Math.round(mg16730.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(mg16730.y))),slope:sp16730,acc:0,maxAcc:0,score:Math.max(0,Math.min(1,score16730/100)),confidence:'preferred',minLinePx16632:4,refined16702:true,terrainGap16730:true,tile16702:tile16730.id,tile16730:tile16730.id};
            }).filter(Boolean).sort((a16730,b16730)=>b16730.score-a16730.score).slice(0,8);
          }));
          const existingCells16730=new Set((supplementalCandidates16702||[]).map(c16730=>String(c16730.x)+','+String(c16730.y))),added16730=[];
          for(const c16730 of tileResults16730.flat().sort((a16730,b16730)=>b16730.score-a16730.score)){
            const k16730=String(c16730.x)+','+String(c16730.y);if(existingCells16730.has(k16730))continue;existingCells16730.add(k16730);added16730.push(c16730);
          }
          supplementalCandidates16702.push(...added16730);
          window.EARTHLINE_TERRAIN_GAP_REFINEMENT_16730={build:'EARTHLINE 16730',bins:binRows16730.map(r16730=>({bx:r16730.bx,by:r16730.by,valid:r16730.valid,preferred:r16730.preferred,relaxed:r16730.relaxed,preferredRatio:Number(r16730.preferredRatio.toFixed(4)),relaxedRatio:Number(r16730.relaxedRatio.toFixed(4)),relief:Number(r16730.relief.toFixed(1)),starved:r16730.starved})),selectedTiles:tileDefs16730.map(t16730=>({id:t16730.id,b:t16730.b,bx:t16730.row.bx,by:t16730.row.by})),added:added16730.length,elapsedMs:Math.round(performance.now()-start16730),rule:'refine valid low-relief terrain bins where coarse statewide preferred opportunity is <=3.5%, regardless of coast or jurisdiction name',at:new Date().toISOString()};
        }catch(e16730){window.EARTHLINE_TERRAIN_GAP_REFINEMENT_16730={build:'EARTHLINE 16730',error:String(e16730),at:new Date().toISOString()};}
        finally{window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16730;window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16730;}
      }else{
        window.EARTHLINE_TERRAIN_GAP_REFINEMENT_16730={build:'EARTHLINE 16730',bins:binRows16730.map(r16730=>({bx:r16730.bx,by:r16730.by,valid:r16730.valid,preferred:r16730.preferred,relaxed:r16730.relaxed,preferredRatio:Number(r16730.preferredRatio.toFixed(4)),relaxedRatio:Number(r16730.relaxedRatio.toFixed(4)),relief:Number(r16730.relief.toFixed(1)),starved:r16730.starved})),selectedTiles:[],added:0,rule:'no terrain-gap refinement needed',at:new Date().toISOString()};
      }
    }
    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);"""

n=s.count(old)
if n!=1: raise SystemExit(f"16730 anchor expected once, found {n}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("16730 applied")
