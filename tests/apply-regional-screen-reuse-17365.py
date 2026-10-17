from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

fn="async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16702=null){"
if s.count(fn)!=1: raise SystemExit(f"makeSwales anchor count {s.count(fn)}")
s=s.replace(fn,"const earthlineRegionalScreenReuse17365=new WeakMap();\n  "+fn,1)

old="""    if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);
    const preferredEligibleCount16539="""
new="""    const supplementalStart17365=candidates.length;
    const supplementalCount17365=(!focusMode&&Array.isArray(supplementalCandidates16702))?supplementalCandidates16702.length:0;
    if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);
    const supplementalEnd17365=candidates.length;
    const preferredEligibleCount16539="""
if s.count(old)!=1: raise SystemExit(f"supplemental anchor count {s.count(old)}")
s=s.replace(old,new,1)

old="""    const candidatesBeforeJurisdiction16539=candidates.length;
    let jurisdictionRejectedCandidates16539=0;
    if(!focusMode&&jurisdictionGeometry16539){
      const eligible16539=[];let finalScreenYield16661=0;
      for(const candidate16539 of candidates){
        const screened16539=screenJurisdictionCandidate16539(candidate16539);
        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;
        if((++finalScreenYield16661%12)===0)await earthlineCooperativeYield16661();
      }
      candidates.length=0;candidates.push(...eligible16539);
    }
    const jurisdictionEligibleCandidates16539=candidates.length;"""
new="""    const candidatesBeforeJurisdiction16539=candidates.length;
    let jurisdictionRejectedCandidates16539=0;
    if(!focusMode&&jurisdictionGeometry16539){
      const relaxedRawCount17365=Math.max(0,candidates.length-supplementalEnd17365);
      const prior17365=earthlineRegionalScreenReuse17365.get(hy)||null;
      const canReuse17365=!!(prior17365&&
        prior17365.contours===contours&&
        prior17365.jurisdiction===jurisdictionGeometry16539&&
        prior17365.supplemental===supplementalCandidates16702&&
        supplementalCount17365>=prior17365.supplementalCount&&
        supplementalStart17365===prior17365.supplementalStart&&
        relaxedRawCount17365===prior17365.relaxedRawCount);
      const eligible16539=[];let finalScreenYield16661=0;
      if(canReuse17365){
        eligible16539.push(...prior17365.preferred.map(c17365=>Object.assign({},c17365)));
        eligible16539.push(...prior17365.supplemental.map(c17365=>Object.assign({},c17365)));
        jurisdictionRejectedCandidates16539=
          prior17365.preferredRejected+prior17365.supplementalRejected+prior17365.relaxedRejected;
        const newSupplementalStart17365=supplementalStart17365+prior17365.supplementalCount;
        for(let i17365=newSupplementalStart17365;i17365<supplementalEnd17365;i17365++){
          const screened16539=screenJurisdictionCandidate16539(candidates[i17365]);
          if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;
          if((++finalScreenYield16661%12)===0)await earthlineCooperativeYield16661();
        }
        eligible16539.push(...prior17365.relaxed.map(c17365=>Object.assign({},c17365)));
        window.EARTHLINE_REGIONAL_SCREEN_REUSE_17365={
          build:'EARTHLINE 17365',reused:true,
          cachedSupplemental:prior17365.supplementalCount,
          currentSupplemental:supplementalCount17365,
          newlyScreened:Math.max(0,supplementalCount17365-prior17365.supplementalCount),
          at:new Date().toISOString()
        };
      }else{
        const preferred17365=[],supplemental17365=[],relaxed17365=[];
        let preferredRejected17365=0,supplementalRejected17365=0,relaxedRejected17365=0;
        for(let i17365=0;i17365<candidates.length;i17365++){
          const candidate16539=candidates[i17365],screened16539=screenJurisdictionCandidate16539(candidate16539);
          const group17365=i17365<supplementalStart17365?'preferred':(i17365<supplementalEnd17365?'supplemental':'relaxed');
          if(screened16539){
            eligible16539.push(screened16539);
            const snapshot17365=Object.assign({},screened16539);
            if(group17365==='preferred')preferred17365.push(snapshot17365);
            else if(group17365==='supplemental')supplemental17365.push(snapshot17365);
            else relaxed17365.push(snapshot17365);
          }else{
            jurisdictionRejectedCandidates16539++;
            if(group17365==='preferred')preferredRejected17365++;
            else if(group17365==='supplemental')supplementalRejected17365++;
            else relaxedRejected17365++;
          }
          if((++finalScreenYield16661%12)===0)await earthlineCooperativeYield16661();
        }
        if(Array.isArray(supplementalCandidates16702)){
          earthlineRegionalScreenReuse17365.set(hy,{
            contours:contours,jurisdiction:jurisdictionGeometry16539,supplemental:supplementalCandidates16702,
            supplementalStart:supplementalStart17365,supplementalCount:supplementalCount17365,
            relaxedRawCount:relaxedRawCount17365,
            preferred:preferred17365,supplemental:supplemental17365,relaxed:relaxed17365,
            preferredRejected:preferredRejected17365,supplementalRejected:supplementalRejected17365,relaxedRejected:relaxedRejected17365
          });
        }
        window.EARTHLINE_REGIONAL_SCREEN_REUSE_17365={
          build:'EARTHLINE 17365',reused:false,cachedSupplemental:supplementalCount17365,currentSupplemental:supplementalCount17365,newlyScreened:supplementalCount17365,at:new Date().toISOString()
        };
      }
      candidates.length=0;candidates.push(...eligible16539);
    }
    const jurisdictionEligibleCandidates16539=candidates.length;"""
if s.count(old)!=1: raise SystemExit(f"final screen anchor count {s.count(old)}")
s=s.replace(old,new,1)

s="<!-- EARTHLINE_REGIONAL_SCREEN_REUSE_17365: same-run exact reuse of already-screened Regional candidate groups; only newly appended supplemental candidates are jurisdiction-screened on statewide rerun. Ranking, spacing, capacity and final verdict unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed exact Regional screen reuse 17365")
