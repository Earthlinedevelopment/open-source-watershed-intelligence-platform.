from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name, old, new):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

old="""      const gaps16731=bins16731.filter(r16731=>{
        const ratio16731=r16731.valid?r16731.opportunity/r16731.valid:0;
        return r16731.valid>=45&&r16731.opportunity>=8&&ratio16731>=.035&&r16731.swales===0;
      }).sort((a16731,b16731)=>{
        const pa16731=(a16731.opportunity/Math.max(1,a16731.valid))*100+a16731.opportunity/20;
        const pb16731=(b16731.opportunity/Math.max(1,b16731.valid))*100+b16731.opportunity/20;
        return pb16731-pa16731;
      });
      const selected16731=[];"""

new="""      const gaps16731=bins16731.filter(r16731=>{
        const ratio16731=r16731.valid?r16731.opportunity/r16731.valid:0;
        return r16731.valid>=45&&r16731.opportunity>=8&&ratio16731>=.035&&r16731.swales===0;
      }).sort((a16731,b16731)=>{
        const pa16731=(a16731.opportunity/Math.max(1,a16731.valid))*100+a16731.opportunity/20;
        const pb16731=(b16731.opportunity/Math.max(1,b16731.valid))*100+b16731.opportunity/20;
        return pb16731-pa16731;
      });
      /* EARTHLINE 16749 — gap refinement must be additive, not a shell game.
         Before adding a new exact-cell candidate, retain one already-published,
         terrain-derived corridor anchor from every significant bin that was
         covered on the first pass. The rerun can then fill a missing bin without
         making a different valid bin disappear. */
      const coverageCarry16749=[];
      if(gaps16731.length){
        const bestByBin16749=new Map();
        for(const f16749 of swales.features||[]){
          const seg16749=f16749&&f16749.geometry&&f16749.geometry.type==='LineString'?f16749.geometry.coordinates:null;
          if(!Array.isArray(seg16749)||!seg16749.length)continue;
          const mid16749=seg16749[Math.floor((seg16749.length-1)/2)],g16749=llGrid(hy,mid16749);
          if(!g16749||!Number.isFinite(g16749.x)||!Number.isFinite(g16749.y))continue;
          const bx16749=Math.max(0,Math.min(binsX16731-1,Math.floor(Number(g16749.x)*binsX16731/Math.max(1,hy.w))));
          const by16749=Math.max(0,Math.min(binsY16731-1,Math.floor(Number(g16749.y)*binsY16731/Math.max(1,hy.h))));
          const row16749=bins16731.find(r16749=>r16749.bx===bx16749&&r16749.by===by16749);
          if(!row16749||row16749.valid<45||row16749.opportunity<8||(row16749.opportunity/Math.max(1,row16749.valid))<.035)continue;
          const p16749=f16749.properties||{},score16749=Math.max(0,Math.min(1,Number(p16749.score||0)/100)),key16749=bx16749+','+by16749;
          const prior16749=bestByBin16749.get(key16749);
          if(!prior16749||score16749>prior16749.score)bestByBin16749.set(key16749,{segment:seg16749,x:Math.max(1,Math.min(hy.w-2,Math.round(g16749.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(g16749.y))),slope:Number(p16749.slope_pct||.2),acc:0,maxAcc:0,score:score16749,confidence:String(p16749.confidence||'preferred'),minLinePx16632:.75,coverageGap16731:true,coverageCarry16749:true,tile16731:'carry-'+key16749,tile16702:'carry-'+key16749,bx16749,by16749});
        }
        const existingCarryCells16749=new Set((supplementalCandidates16702||[]).map(c16749=>String(c16749.x)+','+String(c16749.y)));
        for(const c16749 of bestByBin16749.values()){
          const k16749=String(c16749.x)+','+String(c16749.y);if(existingCarryCells16749.has(k16749))continue;
          existingCarryCells16749.add(k16749);supplementalCandidates16702.push(c16749);coverageCarry16749.push(c16749);
        }
      }
      window.EARTHLINE_COVERAGE_CARRY_16749={build:'EARTHLINE 16749',triggered:gaps16731.length>0,gapsBefore:gaps16731.map(r16749=>({bx:r16749.bx,by:r16749.by})),carried:coverageCarry16749.length,carriedBins:coverageCarry16749.map(c16749=>({bx:c16749.bx16749,by:c16749.by16749,score:c16749.score})),rule:'when exact-cell refinement is needed, preserve one already-published corridor anchor from every significant covered bin before rerunning selection',at:new Date().toISOString()};
      const selected16731=[];"""
patch("carry insert",old,new)

old2="""    const refinedPool16713=!focusMode?candidates.filter(c=>c&&(c.refined16710||c.refined16702)):[];"""
new2="""    const refinedPool16713=!focusMode?candidates.filter(c=>c&&(c.refined16710||c.refined16702||c.coverageCarry16749)):[];"""
patch("carry selection pool",old2,new2)

old3="""window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731={build:'EARTHLINE 16746',coverageMetric:'corridor-midpoint-in-6x6-terrain-bin'"""
new3="""window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731={build:'EARTHLINE 16749',coverageMetric:'corridor-midpoint-in-6x6-terrain-bin'"""
patch("audit build",old3,new3)

p.write_text(s,encoding="utf-8")
print("16749 applied")
