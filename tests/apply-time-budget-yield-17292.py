from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old1="""      let count16539=0,yieldCount16661=0;
      for(const candidate16539 of list16539){if(screenJurisdictionCandidate16539(candidate16539))count16539++;if((++yieldCount16661%12)===0)await earthlineCooperativeYield16661();}
      return count16539;"""
new1="""      let count16539=0,yieldCount16661=0,lastYieldAt17292=performance.now();
      for(const candidate16539 of list16539){
        if(screenJurisdictionCandidate16539(candidate16539))count16539++;
        yieldCount16661++;
        if((yieldCount16661&63)===0&&performance.now()-lastYieldAt17292>=8){await earthlineCooperativeYield16661();lastYieldAt17292=performance.now();}
      }
      return count16539;"""
n1=s.count(old1);print("preferred-screen-yield",n1)
if n1!=1: raise SystemExit(f"preferred-screen yield anchor {n1}")
s=s.replace(old1,new1,1)

old2="""      const eligible16539=[];let finalScreenYield16661=0;
      for(const candidate16539 of candidates){
        const screened16539=screenJurisdictionCandidate16539(candidate16539);
        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;
        if((++finalScreenYield16661%12)===0)await earthlineCooperativeYield16661();
      }"""
new2="""      const eligible16539=[];let finalScreenYield16661=0,lastFinalScreenYieldAt17292=performance.now();
      for(const candidate16539 of candidates){
        const screened16539=screenJurisdictionCandidate16539(candidate16539);
        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;
        finalScreenYield16661++;
        if((finalScreenYield16661&63)===0&&performance.now()-lastFinalScreenYieldAt17292>=8){await earthlineCooperativeYield16661();lastFinalScreenYieldAt17292=performance.now();}
      }"""
n2=s.count(old2);print("final-screen-yield",n2)
if n2!=1: raise SystemExit(f"final-screen yield anchor {n2}")
s=s.replace(old2,new2,1)

s="/* EARTHLINE_TIME_BUDGET_YIELD_17292 — makeSwales jurisdiction loops yield after >=8ms of real CPU work, checked every 64 candidates, instead of timer-yielding every 12 candidates; ordering/science unchanged. */\n"+s
p.write_text(s,encoding="utf-8")
print("17292 time-budgeted makeSwales yields applied")
