from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

coord='''        c16736.coverageBinBasis16767=binBasis16767;
        c16736.coverageSubBin16771=subKey16771;'''
coord_new=coord+'''
        c16736.coverageGX16774=gx16767;c16736.coverageGY16774=gy16767;'''
if s.count(coord)!=1:
    raise SystemExit(f"16774 coordinate anchor expected once, found {s.count(coord)}")
s=s.replace(coord,coord_new,1)

start="    const regionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));"
end="    const refinedPool16713=!focusMode?candidates.filter(c=>c&&(c.refined16710||c.refined16702||c.coverageCarry16749)):[];"
a=s.find(start); b=s.find(end,a)
if a<0 or b<0:
    raise SystemExit("16774 selection anchors missing")

replacement=r'''    const regionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));
    let gapGroups16774=0,heldForGapGroups16774=0;
    if(!focusMode){
      const subgroups16774=new Map(),selectedSubs16774=new Map();let totalSubs16774=0;
      for(const [key16774,list16774] of coverageGroups16736){
        list16774.sort((a16774,b16774)=>(Number(b16774.score)||0)-(Number(a16774.score)||0));
        const parts16774=String(key16774).split(',').map(Number),bx16774=parts16774[0],by16774=parts16774[1];
        const cells16774=new Map();
        for(const c16774 of list16774){
          const gx16774=Number(c16774.coverageGX16774),gy16774=Number(c16774.coverageGY16774);
          if(!Number.isFinite(gx16774)||!Number.isFinite(gy16774))continue;
          const fx16774=Math.max(0,Math.min(17,Math.floor(gx16774*18/Math.max(1,hy.w))));
          const fy16774=Math.max(0,Math.min(17,Math.floor(gy16774*18/Math.max(1,hy.h))));
          const lx16774=Math.max(0,Math.min(2,fx16774-bx16774*3)),ly16774=Math.max(0,Math.min(2,fy16774-by16774*3));
          const sk16774=lx16774+','+ly16774;let cell16774=cells16774.get(sk16774);
          if(!cell16774)cells16774.set(sk16774,cell16774=[]);cell16774.push(c16774);
        }
        const reps16774=[];
        for(const [sk16774,cell16774] of cells16774){
          cell16774.sort((a16774,b16774)=>(Number(b16774.score)||0)-(Number(a16774.score)||0));
          const p16774=sk16774.split(',').map(Number);
          reps16774.push({subkey:sk16774,lx:p16774[0],ly:p16774[1],count:cell16774.length,candidate:cell16774[0]});
        }
        reps16774.sort((a16774,b16774)=>(Number(b16774.candidate.score)||0)-(Number(a16774.candidate.score)||0));
        subgroups16774.set(key16774,reps16774);selectedSubs16774.set(key16774,[]);totalSubs16774+=reps16774.length;
      }
      gapGroups16774=new Set(candidates.filter(c16774=>c16774&&c16774.coverageGap16731&&c16774.tile16731).map(c16774=>String(c16774.tile16731))).size;
      heldForGapGroups16774=Math.min(regionalCapacity16755,gapGroups16774*2);
      const reserveBudget16774=Math.min(Math.max(0,regionalCapacity16755-heldForGapGroups16774),totalSubs16774,coverageGroups16736.size*3);
      const chooseNext16774=(key16774)=>{
        const reps16774=subgroups16774.get(key16774)||[],sel16774=selectedSubs16774.get(key16774)||[];
        const remain16774=reps16774.filter(r16774=>!sel16774.includes(r16774));if(!remain16774.length)return null;
        if(!sel16774.length)return remain16774[0];
        let best16774=null,bestMetric16774=-Infinity;
        for(const r16774 of remain16774){
          const d16774=Math.min(...sel16774.map(s16774=>Math.hypot(r16774.lx-s16774.lx,r16774.ly-s16774.ly)));
          const metric16774=d16774*1000+r16774.count*10+(Number(r16774.candidate.score)||0);
          if(metric16774>bestMetric16774){bestMetric16774=metric16774;best16774=r16774;}
        }
        return best16774;
      };
      while(coverageReserved16736.length<reserveBudget16774){
        let bestKey16774=null,bestRatio16774=Infinity,bestOcc16774=-1,bestScore16774=-Infinity;
        for(const [key16774,reps16774] of subgroups16774){
          const sel16774=selectedSubs16774.get(key16774)||[];if(sel16774.length>=reps16774.length)continue;
          const ratio16774=sel16774.length/Math.max(1,reps16774.length),next16774=chooseNext16774(key16774),score16774=Number(next16774?.candidate?.score)||0;
          if(ratio16774<bestRatio16774-1e-9||
             (Math.abs(ratio16774-bestRatio16774)<1e-9&&reps16774.length>bestOcc16774)||
             (Math.abs(ratio16774-bestRatio16774)<1e-9&&reps16774.length===bestOcc16774&&score16774>bestScore16774)){
            bestKey16774=key16774;bestRatio16774=ratio16774;bestOcc16774=reps16774.length;bestScore16774=score16774;
          }
        }
        if(bestKey16774===null)break;
        const next16774=chooseNext16774(bestKey16774);if(!next16774)break;
        selectedSubs16774.get(bestKey16774).push(next16774);
        const c16774=next16774.candidate;if(!c16774||chosen.includes(c16774))continue;
        chosen.push(c16774);
        coverageReserved16736.push({key:bestKey16774,subBin:next16774.subkey,x:c16774.x,y:c16774.y,score:Number(c16774.score)||0,
          refined:!!(c16774.refined16710||c16774.refined16702),coverageGap:!!c16774.coverageGap16731,
          proportionalReserve16774:true,subcellCandidates:next16774.count,binBasis:c16774.coverageBinBasis16767||'clipped-midpoint'});
      }
      coverageSubsectorPlan16771.length=0;
      for(const [key16774,reps16774] of subgroups16774){
        const sel16774=selectedSubs16774.get(key16774)||[];
        coverageSubsectorPlan16771.push({key:key16774,candidateSubcells:reps16774.length,reservedSubcells:sel16774.length});
      }
    }
    window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16774',candidateBins:coverageGroups16736.size,reserved:coverageReserved16736.length,capacity:regionalCapacity16755,rows:coverageReserved16736,subsectorPlan:coverageSubsectorPlan16771,midpointOwnedBins:true,reservePerBin:'shared budget equivalent to 3 per occupied bin',subsectorGrid:'3x3 inside each 6x6 terrain sector',subsectorReserve:true,proportionalReserve:true,gapGroupsHeld:gapGroups16774,capacityHeldForGapRefinement:heldForGapGroups16774,rule:'distribute the terrain reserve budget proportionally while holding two existing capacity slots for each active high-resolution gap group across occupied 3x3 subregions inside each 6x6 terrain sector; select real screened candidates only; science gates, water safety, final score ordering and capacity remain unchanged',at:new Date().toISOString()};
'''
s=s[:a]+replacement+s[b:]

banner="<!-- EARTHLINE 16774 — GLOBAL PROPORTIONAL TERRAIN-SUBREGION DISPERSION. The existing Regional reserve budget, candidate pool, science gates, water sidecar, jurisdiction containment, ranking semantics and capacity remain unchanged. Selection distributes that same reserve budget across occupied 3x3 subregions inside each 6x6 terrain sector to prevent valid terrain opportunity from collapsing into a few internal locations. No jurisdiction names, synthetic corridors or relaxed science. CANDIDATE / NOT ACCEPTED. -->\n"
if "EARTHLINE 16774 — GLOBAL PROPORTIONAL" not in s:
    s=banner+s

p.write_text(s,encoding="utf-8")
print("16774 applied")
