from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

coord='''        c16736.coverageBinBasis16767=binBasis16767;
        c16736.coverageSubBin16771=subKey16771;'''
coord_new=coord+'''
        c16736.coverageGX16775=gx16767;c16736.coverageGY16775=gy16767;'''
if s.count(coord)!=1:
    raise SystemExit(f"16775 coordinate anchor expected once, found {s.count(coord)}")
s=s.replace(coord,coord_new,1)

start="    const regionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));"
end="    const refinedPool16713=!focusMode?candidates.filter(c=>c&&(c.refined16710||c.refined16702||c.coverageCarry16749)):[];"
a=s.find(start); b=s.find(end,a)
if a<0 or b<0:
    raise SystemExit("16775 selection anchors missing")

replacement=r'''    const regionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));
    if(!focusMode){
      const subgroups16775=new Map(),selectedSubs16775=new Map();let totalSubs16775=0;
      for(const [key16775,list16775] of coverageGroups16736){
        list16775.sort((a16775,b16775)=>(Number(b16775.score)||0)-(Number(a16775.score)||0));
        const parts16775=String(key16775).split(',').map(Number),bx16775=parts16775[0],by16775=parts16775[1];
        const cells16775=new Map();
        for(const c16775 of list16775){
          const gx16775=Number(c16775.coverageGX16775),gy16775=Number(c16775.coverageGY16775);
          if(!Number.isFinite(gx16775)||!Number.isFinite(gy16775))continue;
          const fx16775=Math.max(0,Math.min(17,Math.floor(gx16775*18/Math.max(1,hy.w))));
          const fy16775=Math.max(0,Math.min(17,Math.floor(gy16775*18/Math.max(1,hy.h))));
          const lx16775=Math.max(0,Math.min(2,fx16775-bx16775*3)),ly16775=Math.max(0,Math.min(2,fy16775-by16775*3));
          const sk16775=lx16775+','+ly16775;let cell16775=cells16775.get(sk16775);
          if(!cell16775)cells16775.set(sk16775,cell16775=[]);cell16775.push(c16775);
        }
        const reps16775=[];
        for(const [sk16775,cell16775] of cells16775){
          cell16775.sort((a16775,b16775)=>(Number(b16775.score)||0)-(Number(a16775.score)||0));
          const p16775=sk16775.split(',').map(Number);
          reps16775.push({subkey:sk16775,lx:p16775[0],ly:p16775[1],count:cell16775.length,candidate:cell16775[0]});
        }
        reps16775.sort((a16775,b16775)=>(Number(b16775.candidate.score)||0)-(Number(a16775.candidate.score)||0));
        subgroups16775.set(key16775,reps16775);selectedSubs16775.set(key16775,[]);totalSubs16775+=reps16775.length;
      }
      const reserveBudget16775=Math.min(regionalCapacity16755,totalSubs16775,coverageGroups16736.size*3);
      const chooseNext16775=(key16775)=>{
        const reps16775=subgroups16775.get(key16775)||[],sel16775=selectedSubs16775.get(key16775)||[];
        const remain16775=reps16775.filter(r16775=>!sel16775.includes(r16775));if(!remain16775.length)return null;
        if(!sel16775.length)return remain16775[0];
        let best16775=null,bestMetric16775=-Infinity;
        for(const r16775 of remain16775){
          const d16775=Math.min(...sel16775.map(s16775=>Math.hypot(r16775.lx-s16775.lx,r16775.ly-s16775.ly)));
          const metric16775=d16775*1000+r16775.count*10+(Number(r16775.candidate.score)||0);
          if(metric16775>bestMetric16775){bestMetric16775=metric16775;best16775=r16775;}
        }
        return best16775;
      };
      while(coverageReserved16736.length<reserveBudget16775){
        let bestKey16775=null,bestRatio16775=Infinity,bestOcc16775=-1,bestScore16775=-Infinity;
        for(const [key16775,reps16775] of subgroups16775){
          const sel16775=selectedSubs16775.get(key16775)||[];if(sel16775.length>=reps16775.length)continue;
          const ratio16775=sel16775.length/Math.max(1,reps16775.length),next16775=chooseNext16775(key16775),score16775=Number(next16775?.candidate?.score)||0;
          if(ratio16775<bestRatio16775-1e-9||
             (Math.abs(ratio16775-bestRatio16775)<1e-9&&reps16775.length>bestOcc16775)||
             (Math.abs(ratio16775-bestRatio16775)<1e-9&&reps16775.length===bestOcc16775&&score16775>bestScore16775)){
            bestKey16775=key16775;bestRatio16775=ratio16775;bestOcc16775=reps16775.length;bestScore16775=score16775;
          }
        }
        if(bestKey16775===null)break;
        const next16775=chooseNext16775(bestKey16775);if(!next16775)break;
        selectedSubs16775.get(bestKey16775).push(next16775);
        const c16775=next16775.candidate;if(!c16775||chosen.includes(c16775))continue;
        chosen.push(c16775);
        coverageReserved16736.push({key:bestKey16775,subBin:next16775.subkey,x:c16775.x,y:c16775.y,score:Number(c16775.score)||0,
          refined:!!(c16775.refined16710||c16775.refined16702),coverageGap:!!c16775.coverageGap16731,
          proportionalReserve16775:true,subcellCandidates:next16775.count,binBasis:c16775.coverageBinBasis16767||'clipped-midpoint'});
      }
      coverageSubsectorPlan16771.length=0;
      for(const [key16775,reps16775] of subgroups16775){
        const sel16775=selectedSubs16775.get(key16775)||[];
        coverageSubsectorPlan16771.push({key:key16775,candidateSubcells:reps16775.length,reservedSubcells:sel16775.length});
      }
    }
    window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16775',candidateBins:coverageGroups16736.size,reserved:coverageReserved16736.length,capacity:regionalCapacity16755,rows:coverageReserved16736,subsectorPlan:coverageSubsectorPlan16771,midpointOwnedBins:true,reservePerBin:'shared budget equivalent to 3 per occupied bin',subsectorGrid:'3x3 inside each 6x6 terrain sector',subsectorReserve:true,proportionalReserve:true,rule:'distribute the unchanged global terrain reserve budget proportionally across occupied 3x3 subregions inside each 6x6 terrain sector; select real screened candidates only; science gates, water safety, final score ordering and capacity remain unchanged',at:new Date().toISOString()};
'''
s=s[:a]+replacement+s[b:]

old_dem="            const d16731=await loadDEM(tile16731.b,64,64,8000,'coverage-gap refinement '+tile16731.id);"
new_dem="            const d16731=await loadDEM(tile16731.b,48,48,8000,'coverage-gap refinement '+tile16731.id);"
if s.count(old_dem)!=1:
    raise SystemExit(f"16775 DEM anchor expected once, found {s.count(old_dem)}")
s=s.replace(old_dem,new_dem,1)

banner="<!-- EARTHLINE 16775 — GLOBAL PROPORTIONAL DISPERSION + 48x48 LOCAL GAP REFINEMENT. The Regional reserve budget, candidate pool, science gates, water sidecar, jurisdiction containment, ranking semantics and capacity remain unchanged; only the already-authoritative local coverage-gap DEM grid changes from 64x64 to 48x48, still approximately 3x finer per axis than the statewide grid within a 1/6-state sector. Selection distributes that same reserve budget across occupied 3x3 subregions inside each 6x6 terrain sector to prevent valid terrain opportunity from collapsing into a few internal locations. No jurisdiction names, synthetic corridors or relaxed science. CANDIDATE / NOT ACCEPTED. -->\n"
if "EARTHLINE 16775 — GLOBAL PROPORTIONAL" not in s:
    s=banner+s

p.write_text(s,encoding="utf-8")
print("16775 applied")
