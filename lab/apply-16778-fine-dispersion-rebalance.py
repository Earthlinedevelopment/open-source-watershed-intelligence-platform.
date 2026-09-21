from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_head="<!-- EARTHLINE 16777 — GLOBAL STATE-REGISTRY PRECEDENCE REPAIR."
new_head="<!-- EARTHLINE 16778 — COUNT-NEUTRAL FINE-CELL DISPERSION REBALANCE. Regional selection keeps the same screened candidate pool, total chosen count, science gates, water sidecar, jurisdiction containment and ranking semantics. When a large candidate field leaves >=18 valid 18x18 cells unrepresented and fine-cell coverage is below 86%, low-score duplicate selections are swapped for the best real candidate in missing fine cells. Donor parent sectors retain at least three chosen corridors. No jurisdiction names, synthetic corridors, relaxed science or added capacity. CANDIDATE / NOT ACCEPTED. -->\n"+old_head
if old_head not in s:
    raise SystemExit("16777 header anchor missing")
s=s.replace(old_head,new_head,1)

old_marker="window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16777'"
new_marker="window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16778'"
if s.count(old_marker)!=1:
    raise SystemExit(f"16777 build marker count {s.count(old_marker)}")
s=s.replace(old_marker,new_marker,1)

anchor="""    if(window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736){
      window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736.reserved=coverageReserved16736.length;
      window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736.subsectorExtraSelected=coverageSubsectorExtraSelected16771;
      window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736.rows=coverageReserved16736;
      window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736.subsectorPlan=coverageSubsectorPlan16771;
    }
    for(const c of candidates){"""

insert="""    if(window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736){
      window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736.reserved=coverageReserved16736.length;
      window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736.subsectorExtraSelected=coverageSubsectorExtraSelected16771;
      window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736.rows=coverageReserved16736;
      window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736.subsectorPlan=coverageSubsectorPlan16771;
    }

    /* EARTHLINE 16778 — count-neutral fine-cell dispersion.
       Replace duplicate chosen locations with already-screened valid candidates
       in missing 18x18 cells. Never increase chosen count; donor parent sectors
       keep at least three chosen corridors. */
    if(!focusMode&&chosen.length&&candidates.length){
      const point16778=c16778=>{
        const gx16778=Number.isFinite(Number(c16778&&c16778.coverageGX16775))?Number(c16778.coverageGX16775):Number(c16778&&c16778.x);
        const gy16778=Number.isFinite(Number(c16778&&c16778.coverageGY16775))?Number(c16778.coverageGY16775):Number(c16778&&c16778.y);
        if(!Number.isFinite(gx16778)||!Number.isFinite(gy16778))return null;
        const fx16778=Math.max(0,Math.min(17,Math.floor(gx16778*18/Math.max(1,hy.w))));
        const fy16778=Math.max(0,Math.min(17,Math.floor(gy16778*18/Math.max(1,hy.h))));
        return {fx:fx16778,fy:fy16778,cell:fx16778+','+fy16778,parent:Math.floor(fx16778/3)+','+Math.floor(fy16778/3)};
      };
      const bestByCell16778=new Map(),candidateParentCells16778=new Map();
      for(const c16778 of candidates){
        const p16778=point16778(c16778);if(!p16778)continue;
        const prior16778=bestByCell16778.get(p16778.cell);
        if(!prior16778||(Number(c16778.score)||0)>(Number(prior16778.candidate.score)||0))bestByCell16778.set(p16778.cell,{candidate:c16778,point:p16778});
        let set16778=candidateParentCells16778.get(p16778.parent);if(!set16778)candidateParentCells16778.set(p16778.parent,set16778=new Set());set16778.add(p16778.cell);
      }
      const chosenCellCount16778=new Map(),chosenParentCount16778=new Map();
      const rebuildChosenCounts16778=()=>{
        chosenCellCount16778.clear();chosenParentCount16778.clear();
        for(const c16778 of chosen){
          const p16778=point16778(c16778);if(!p16778)continue;
          chosenCellCount16778.set(p16778.cell,(chosenCellCount16778.get(p16778.cell)||0)+1);
          chosenParentCount16778.set(p16778.parent,(chosenParentCount16778.get(p16778.parent)||0)+1);
        }
      };
      rebuildChosenCounts16778();
      const candidateCells16778=bestByCell16778.size,initialChosenCells16778=chosenCellCount16778.size;
      const initialCoverage16778=candidateCells16778?initialChosenCells16778/candidateCells16778:1;
      const missingInitial16778=Math.max(0,candidateCells16778-initialChosenCells16778);
      const reachable16778=Math.min(candidateCells16778,chosen.length);
      const targetCells16778=Math.min(reachable16778,Math.ceil(candidateCells16778*.92));
      let swaps16778=0;
      if(candidateCells16778>=80&&missingInitial16778>=18&&initialCoverage16778<.86&&targetCells16778>initialChosenCells16778){
        while(chosenCellCount16778.size<targetCells16778&&swaps16778<36){
          const represented16778=new Set(chosenCellCount16778.keys());
          const missing16778=[];
          for(const [cell16778,row16778] of bestByCell16778){
            if(represented16778.has(cell16778))continue;
            const parentCells16778=candidateParentCells16778.get(row16778.point.parent)||new Set();
            let representedParentCells16778=0;
            for(const k16778 of parentCells16778)if(represented16778.has(k16778))representedParentCells16778++;
            const parentCount16778=chosenParentCount16778.get(row16778.point.parent)||0;
            const needThree16778=Math.max(0,Math.min(3,parentCells16778.size)-parentCount16778);
            let nearest16778=99;
            for(const k16778 of represented16778){
              const parts16778=k16778.split(',').map(Number);
              nearest16778=Math.min(nearest16778,Math.hypot(row16778.point.fx-parts16778[0],row16778.point.fy-parts16778[1]));
            }
            missing16778.push({cell:cell16778,row:row16778,parentRatio:parentCells16778.size?representedParentCells16778/parentCells16778.size:1,needThree:needThree16778,nearest:nearest16778});
          }
          if(!missing16778.length)break;
          missing16778.sort((a16778,b16778)=>b16778.needThree-a16778.needThree||a16778.parentRatio-b16778.parentRatio||b16778.nearest-a16778.nearest||(Number(b16778.row.candidate.score)||0)-(Number(a16778.row.candidate.score)||0));
          const add16778=missing16778[0];
          let donorIndex16778=-1,donorMetric16778=Infinity;
          for(let i16778=0;i16778<chosen.length;i16778++){
            const c16778=chosen[i16778],p16778=point16778(c16778);if(!p16778)continue;
            if((chosenCellCount16778.get(p16778.cell)||0)<=1)continue;
            if((chosenParentCount16778.get(p16778.parent)||0)<=3)continue;
            const parentCells16778=candidateParentCells16778.get(p16778.parent)||new Set();
            let representedParentCells16778=0;for(const k16778 of parentCells16778)if(chosenCellCount16778.has(k16778))representedParentCells16778++;
            const donorCoverage16778=parentCells16778.size?representedParentCells16778/parentCells16778.size:1;
            const metric16778=(Number(c16778.score)||0)-donorCoverage16778*.05;
            if(metric16778<donorMetric16778){donorMetric16778=metric16778;donorIndex16778=i16778;}
          }
          if(donorIndex16778<0)break;
          chosen[donorIndex16778]=add16778.row.candidate;
          swaps16778++;
          rebuildChosenCounts16778();
        }
      }
      window.EARTHLINE_FINE_DISPERSION_REBALANCE_16778={
        build:'EARTHLINE 16778',candidateCells:candidateCells16778,chosenCount:chosen.length,
        initialChosenCells:initialChosenCells16778,finalChosenCells:chosenCellCount16778.size,
        initialCoverage:initialCoverage16778,finalCoverage:candidateCells16778?chosenCellCount16778.size/candidateCells16778:1,
        missingInitial:missingInitial16778,swaps:swaps16778,targetCells:targetCells16778,
        rule:'count-neutral swaps replace duplicate chosen fine cells with real screened candidates in missing 18x18 cells; donor parent sectors retain at least three chosen corridors',
        at:new Date().toISOString()
      };
      if(window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736){
        window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736.fineRebalance16778=window.EARTHLINE_FINE_DISPERSION_REBALANCE_16778;
      }
    }
    for(const c of candidates){"""

if s.count(anchor)!=1:
    raise SystemExit(f"selection anchor count {s.count(anchor)}")
s=s.replace(anchor,insert,1)

p.write_text(s,encoding="utf-8")
print("16778 applied")
