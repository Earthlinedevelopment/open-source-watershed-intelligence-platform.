from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

old='''        if(Number(M.acc[i15836]||0)>=chanThr){lastReason15836="protected-major-channel";continue;}
        if(slopePct(x15836,y15836)>maxS){lastReason15836="slope-too-steep";continue;}
        const L15836=Number(M.h[i15836]);if(!Number.isFinite(L15836)){lastReason15836="missing-elevation";continue;}
        let cachedFlow16320=flowTraceCache16320.get(i15836);
        if(!cachedFlow16320){
          flowCacheAudit16320.traceMisses++;
          const pts16320=traceLevelContour(x15836,y15836,L15836,maxS,levelStep,deadline15771);'''

new='''        if(Number(M.acc[i15836]||0)>=chanThr){lastReason15836="protected-major-channel";continue;}
        const L15836=Number(M.h[i15836]);if(!Number.isFinite(L15836)){lastReason15836="missing-elevation";continue;}
        let seedX15836=x15836,seedY15836=y15836;
        if(slopePct(seedX15836,seedY15836)>maxS){
          const nearbySafe15836=earthlineNearestContourCell(seedX15836,seedY15836,L15836,maxS);
          if(!nearbySafe15836){lastReason15836="no-safe-contour-near-flow-path";continue;}
          seedX15836=nearbySafe15836[0];seedY15836=nearbySafe15836[1];
        }
        const seedKey15836=idx(Math.round(seedX15836),Math.round(seedY15836));
        let cachedFlow16320=flowTraceCache16320.get(seedKey15836);
        if(!cachedFlow16320){
          flowCacheAudit16320.traceMisses++;
          const pts16320=traceLevelContour(seedX15836,seedY15836,L15836,maxS,levelStep,deadline15771);'''

if s.count(old)!=1:
    raise SystemExit(f"STOP flow-first owner anchor count={s.count(old)}")

s=s.replace(old,new,1)

old2='''          flowTraceCache16320.set(i15836,cachedFlow16320);'''
new2='''          flowTraceCache16320.set(seedKey15836,cachedFlow16320);'''
if s.count(old2)!=1:
    raise SystemExit(f"STOP flow trace cache anchor count={s.count(old2)}")
s=s.replace(old2,new2,1)

p.write_text(s,encoding="utf-8")
print("Flow-first Property owner now searches for an adjacent exclusion-safe <=4% contour crossing before rejecting a runoff path.")
