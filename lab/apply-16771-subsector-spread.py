from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="""    const coverageGroups16736=new Map(),coverageReserved16736=[];
    if(!focusMode){
      for(const c16736 of candidates){
        if(!c16736)continue;
        const seg16736=Array.isArray(c16736.segment)?c16736.segment:[],mid16736=seg16736[Math.floor((seg16736.length-1)/2)]||null;
        const mg16736=mid16736?llGrid(hy,mid16736):null;
        let gx16767=null,gy16767=null,binBasis16767='clipped-midpoint';
        if(mg16736&&Number.isFinite(Number(mg16736.x))&&Number.isFinite(Number(mg16736.y))){
          gx16767=Number(mg16736.x);gy16767=Number(mg16736.y);
        }else if(Number.isFinite(Number(c16736.x))&&Number.isFinite(Number(c16736.y))){
          gx16767=Number(c16736.x);gy16767=Number(c16736.y);binBasis16767='source-fallback';
        }
        if(!Number.isFinite(gx16767)||!Number.isFinite(gy16767))continue;
        const bx16736=Math.max(0,Math.min(5,Math.floor(gx16767*6/Math.max(1,hy.w))));
        const by16736=Math.max(0,Math.min(5,Math.floor(gy16767*6/Math.max(1,hy.h))));
        const key16736=bx16736+','+by16736;
        let list16736=coverageGroups16736.get(key16736);
        if(!list16736)coverageGroups16736.set(key16736,list16736=[]);
        list16736.push(c16736);c16736.coverageBinBasis16767=binBasis16767;
      }
      for(const [key16736,list16736] of coverageGroups16736){
        list16736.sort((a16736,b16736)=>(Number(b16736.score)||0)-(Number(a16736.score)||0));
        const reserveTarget16767=Math.min(3,list16736.length),reserve16767=[];
        for(const c16767 of list16736){
          if(reserve16767.length>=reserveTarget16767)break;
          if(!reserve16767.length||reserve16767.every(p16767=>Math.hypot(Number(c16767.x)-Number(p16767.x),Number(c16767.y)-Number(p16767.y))>=2))reserve16767.push(c16767);
        }
        if(reserve16767.length<reserveTarget16767){
          for(const c16767 of list16736){
            if(reserve16767.length>=reserveTarget16767)break;
            if(!reserve16767.includes(c16767))reserve16767.push(c16767);
          }
        }
        for(const c16736 of reserve16767){
          if(c16736&&!chosen.includes(c16736)){
            chosen.push(c16736);
            coverageReserved16736.push({key:key16736,x:c16736.x,y:c16736.y,score:Number(c16736.score)||0,refined:!!(c16736.refined16710||c16736.refined16702),coverageGap:!!c16736.coverageGap16731,densityReserve16767:true,binBasis:c16736.coverageBinBasis16767||'clipped-midpoint'});
          }
        }
      }
    }
    const regionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));
    window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16767',candidateBins:coverageGroups16736.size,reserved:coverageReserved16736.length,capacity:regionalCapacity16755,rows:coverageReserved16736,midpointOwnedBins:true,reservePerBin:3,densityReserve:true,rule:'group candidates by the actual clipped corridor midpoint used by the coverage audit, reserve up to three spatially distinct valid terrain-derived candidates per occupied 6x6 sector, then let the existing score/spacing owner fill remaining capacity; science gates and final score ordering are unchanged',at:new Date().toISOString()};"""

new="""    const coverageGroups16736=new Map(),coverageReserved16736=[],coverageSubsectorExtras16771=[],coverageSubsectorPlan16771=[];
    if(!focusMode){
      for(const c16736 of candidates){
        if(!c16736)continue;
        const seg16736=Array.isArray(c16736.segment)?c16736.segment:[],mid16736=seg16736[Math.floor((seg16736.length-1)/2)]||null;
        const mg16736=mid16736?llGrid(hy,mid16736):null;
        let gx16767=null,gy16767=null,binBasis16767='clipped-midpoint';
        if(mg16736&&Number.isFinite(Number(mg16736.x))&&Number.isFinite(Number(mg16736.y))){
          gx16767=Number(mg16736.x);gy16767=Number(mg16736.y);
        }else if(Number.isFinite(Number(c16736.x))&&Number.isFinite(Number(c16736.y))){
          gx16767=Number(c16736.x);gy16767=Number(c16736.y);binBasis16767='source-fallback';
        }
        if(!Number.isFinite(gx16767)||!Number.isFinite(gy16767))continue;
        const bx16736=Math.max(0,Math.min(5,Math.floor(gx16767*6/Math.max(1,hy.w))));
        const by16736=Math.max(0,Math.min(5,Math.floor(gy16767*6/Math.max(1,hy.h))));
        const fineBx16771=Math.max(0,Math.min(11,Math.floor(gx16767*12/Math.max(1,hy.w))));
        const fineBy16771=Math.max(0,Math.min(11,Math.floor(gy16767*12/Math.max(1,hy.h))));
        const subKey16771=(fineBx16771-(bx16736*2))+','+(fineBy16771-(by16736*2));
        const key16736=bx16736+','+by16736;
        let list16736=coverageGroups16736.get(key16736);
        if(!list16736)coverageGroups16736.set(key16736,list16736=[]);
        list16736.push(c16736);
        c16736.coverageBinBasis16767=binBasis16767;
        c16736.coverageSubBin16771=subKey16771;
      }
    }
    const regionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));
    if(!focusMode){
      for(const [key16736,list16736] of coverageGroups16736){
        list16736.sort((a16736,b16736)=>(Number(b16736.score)||0)-(Number(a16736.score)||0));
        const subBest16771=new Map();
        for(const c16771 of list16736){
          const sub16771=String(c16771.coverageSubBin16771||'0,0');
          if(!subBest16771.has(sub16771))subBest16771.set(sub16771,c16771);
        }
        const representatives16771=Array.from(subBest16771.values()).sort((a16771,b16771)=>(Number(b16771.score)||0)-(Number(a16771.score)||0));
        coverageSubsectorPlan16771.push({key:key16736,candidateSubcells:representatives16771.length,reservedSubcells:0});
        for(const c16771 of representatives16771.slice(0,3)){
          if(c16771&&!chosen.includes(c16771)){
            chosen.push(c16771);
            coverageReserved16736.push({key:key16736,subBin:c16771.coverageSubBin16771||null,x:c16771.x,y:c16771.y,score:Number(c16771.score)||0,refined:!!(c16771.refined16710||c16771.refined16702),coverageGap:!!c16771.coverageGap16731,subsectorReserve16771:true,binBasis:c16771.coverageBinBasis16767||'clipped-midpoint'});
          }
        }
        const plan16771=coverageSubsectorPlan16771[coverageSubsectorPlan16771.length-1];
        plan16771.reservedSubcells=Math.min(3,representatives16771.length);
        if(representatives16771[3])coverageSubsectorExtras16771.push({key:key16736,candidate:representatives16771[3]});
      }
    }
    window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16771',candidateBins:coverageGroups16736.size,reserved:coverageReserved16736.length,capacity:regionalCapacity16755,rows:coverageReserved16736,subsectorPlan:coverageSubsectorPlan16771,midpointOwnedBins:true,reservePerBin:3,subsectorGrid:'2x2 inside each 6x6 terrain sector',subsectorReserve:true,rule:'within each occupied 6x6 terrain sector, reserve the highest-scoring valid candidate from up to three distinct 2x2 sub-sectors first; a fourth distinct sub-sector may use remaining capacity after existing high-resolution refinement; science gates, water safety and final score ordering are unchanged',at:new Date().toISOString()};"""

if s.count(old)!=1:
    raise SystemExit(f"coverage block anchor count={s.count(old)}")
s=s.replace(old,new,1)

old2="""    for(const c of candidates){
      if(chosen.length>=regionalCapacity16755)break;"""
new2="""    coverageSubsectorExtras16771.sort((a16771,b16771)=>(Number(b16771.candidate&&b16771.candidate.score)||0)-(Number(a16771.candidate&&a16771.candidate.score)||0));
    let coverageSubsectorExtraSelected16771=0;
    for(const row16771 of coverageSubsectorExtras16771){
      if(chosen.length>=regionalCapacity16755)break;
      const c16771=row16771&&row16771.candidate;
      if(!c16771||chosen.includes(c16771))continue;
      chosen.push(c16771);coverageSubsectorExtraSelected16771++;
      coverageReserved16736.push({key:row16771.key,subBin:c16771.coverageSubBin16771||null,x:c16771.x,y:c16771.y,score:Number(c16771.score)||0,refined:!!(c16771.refined16710||c16771.refined16702),coverageGap:!!c16771.coverageGap16731,subsectorExtra16771:true,binBasis:c16771.coverageBinBasis16767||'clipped-midpoint'});
      const plan16771=coverageSubsectorPlan16771.find(r16771=>r16771.key===row16771.key);
      if(plan16771)plan16771.reservedSubcells=Math.min(plan16771.candidateSubcells,Number(plan16771.reservedSubcells||0)+1);
    }
    if(window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736){
      window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736.reserved=coverageReserved16736.length;
      window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736.subsectorExtraSelected=coverageSubsectorExtraSelected16771;
      window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736.rows=coverageReserved16736;
      window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736.subsectorPlan=coverageSubsectorPlan16771;
    }
    for(const c of candidates){
      if(chosen.length>=regionalCapacity16755)break;"""
if s.count(old2)!=1:
    raise SystemExit(f"fill-loop anchor count={s.count(old2)}")
s=s.replace(old2,new2,1)

p.write_text(s,encoding="utf-8")
print("EARTHLINE 16771 subsector spread patch applied")
