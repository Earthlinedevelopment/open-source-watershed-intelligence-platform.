from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

coord='''        c16736.coverageBinBasis16767=binBasis16767;
        c16736.coverageSubBin16771=subKey16771;'''
coord_new=coord+'''
        c16736.coverageGX16773=gx16767;c16736.coverageGY16773=gy16767;'''
if s.count(coord)!=1:
    raise SystemExit(f"16773 coordinate anchor expected once, found {s.count(coord)}")
s=s.replace(coord,coord_new,1)

start="    const regionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));"
end="    const refinedPool16713=!focusMode?candidates.filter(c=>c&&(c.refined16710||c.refined16702||c.coverageCarry16749)):[];"
a=s.find(start); b=s.find(end,a)
if a<0 or b<0:
    raise SystemExit("16773 selection anchors missing")

replacement=r'''    const regionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));
    if(!focusMode){
      const subgroups16773=new Map(),selectedSubs16773=new Map();let totalSubs16773=0;
      for(const [key16773,list16773] of coverageGroups16736){
        list16773.sort((a16773,b16773)=>(Number(b16773.score)||0)-(Number(a16773.score)||0));
        const parts16773=String(key16773).split(',').map(Number),bx16773=parts16773[0],by16773=parts16773[1];
        const cells16773=new Map();
        for(const c16773 of list16773){
          const gx16773=Number(c16773.coverageGX16773),gy16773=Number(c16773.coverageGY16773);
          if(!Number.isFinite(gx16773)||!Number.isFinite(gy16773))continue;
          const fx16773=Math.max(0,Math.min(17,Math.floor(gx16773*18/Math.max(1,hy.w))));
          const fy16773=Math.max(0,Math.min(17,Math.floor(gy16773*18/Math.max(1,hy.h))));
          const lx16773=Math.max(0,Math.min(2,fx16773-bx16773*3)),ly16773=Math.max(0,Math.min(2,fy16773-by16773*3));
          const sk16773=lx16773+','+ly16773;let cell16773=cells16773.get(sk16773);
          if(!cell16773)cells16773.set(sk16773,cell16773=[]);cell16773.push(c16773);
        }
        const reps16773=[];
        for(const [sk16773,cell16773] of cells16773){
          cell16773.sort((a16773,b16773)=>(Number(b16773.score)||0)-(Number(a16773.score)||0));
          const p16773=sk16773.split(',').map(Number);
          reps16773.push({subkey:sk16773,lx:p16773[0],ly:p16773[1],count:cell16773.length,candidate:cell16773[0]});
        }
        reps16773.sort((a16773,b16773)=>(Number(b16773.candidate.score)||0)-(Number(a16773.candidate.score)||0));
        subgroups16773.set(key16773,reps16773);selectedSubs16773.set(key16773,[]);totalSubs16773+=reps16773.length;
      }
      const reserveBudget16773=Math.min(regionalCapacity16755,totalSubs16773,coverageGroups16736.size*3);
      const chooseNext16773=(key16773)=>{
        const reps16773=subgroups16773.get(key16773)||[],sel16773=selectedSubs16773.get(key16773)||[];
        const remain16773=reps16773.filter(r16773=>!sel16773.includes(r16773));if(!remain16773.length)return null;
        if(!sel16773.length)return remain16773[0];
        let best16773=null,bestMetric16773=-Infinity;
        for(const r16773 of remain16773){
          const d16773=Math.min(...sel16773.map(s16773=>Math.hypot(r16773.lx-s16773.lx,r16773.ly-s16773.ly)));
          const metric16773=d16773*1000+r16773.count*10+(Number(r16773.candidate.score)||0);
          if(metric16773>bestMetric16773){bestMetric16773=metric16773;best16773=r16773;}
        }
        return best16773;
      };
      while(coverageReserved16736.length<reserveBudget16773){
        let bestKey16773=null,bestRatio16773=Infinity,bestOcc16773=-1,bestScore16773=-Infinity;
        for(const [key16773,reps16773] of subgroups16773){
          const sel16773=selectedSubs16773.get(key16773)||[];if(sel16773.length>=reps16773.length)continue;
          const ratio16773=sel16773.length/Math.max(1,reps16773.length),next16773=chooseNext16773(key16773),score16773=Number(next16773?.candidate?.score)||0;
          if(ratio16773<bestRatio16773-1e-9||
             (Math.abs(ratio16773-bestRatio16773)<1e-9&&reps16773.length>bestOcc16773)||
             (Math.abs(ratio16773-bestRatio16773)<1e-9&&reps16773.length===bestOcc16773&&score16773>bestScore16773)){
            bestKey16773=key16773;bestRatio16773=ratio16773;bestOcc16773=reps16773.length;bestScore16773=score16773;
          }
        }
        if(bestKey16773===null)break;
        const next16773=chooseNext16773(bestKey16773);if(!next16773)break;
        selectedSubs16773.get(bestKey16773).push(next16773);
        const c16773=next16773.candidate;if(!c16773||chosen.includes(c16773))continue;
        chosen.push(c16773);
        coverageReserved16736.push({key:bestKey16773,subBin:next16773.subkey,x:c16773.x,y:c16773.y,score:Number(c16773.score)||0,
          refined:!!(c16773.refined16710||c16773.refined16702),coverageGap:!!c16773.coverageGap16731,
          proportionalReserve16773:true,subcellCandidates:next16773.count,binBasis:c16773.coverageBinBasis16767||'clipped-midpoint'});
      }
      coverageSubsectorPlan16771.length=0;
      for(const [key16773,reps16773] of subgroups16773){
        const sel16773=selectedSubs16773.get(key16773)||[];
        coverageSubsectorPlan16771.push({key:key16773,candidateSubcells:reps16773.length,reservedSubcells:sel16773.length});
      }
    }
    window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16773',candidateBins:coverageGroups16736.size,reserved:coverageReserved16736.length,capacity:regionalCapacity16755,rows:coverageReserved16736,subsectorPlan:coverageSubsectorPlan16771,midpointOwnedBins:true,reservePerBin:'shared budget equivalent to 3 per occupied bin',subsectorGrid:'3x3 inside each 6x6 terrain sector',subsectorReserve:true,proportionalReserve:true,rule:'distribute the unchanged global terrain reserve budget proportionally across occupied 3x3 subregions inside each 6x6 terrain sector; select real screened candidates only; science gates, water safety, final score ordering and capacity remain unchanged',at:new Date().toISOString()};
'''
s=s[:a]+replacement+s[b:]

banner="<!-- EARTHLINE 16773 — GLOBAL PROPORTIONAL TERRAIN-SUBREGION DISPERSION. The existing Regional reserve budget, candidate pool, science gates, water sidecar, jurisdiction containment, ranking semantics and capacity remain unchanged. Selection distributes that same reserve budget across occupied 3x3 subregions inside each 6x6 terrain sector to prevent valid terrain opportunity from collapsing into a few internal locations. No jurisdiction names, synthetic corridors or relaxed science. CANDIDATE / NOT ACCEPTED. -->\n"
if "EARTHLINE 16773 — GLOBAL PROPORTIONAL" not in s:
    s=banner+s

p.write_text(s,encoding="utf-8")
print("16773 applied")
