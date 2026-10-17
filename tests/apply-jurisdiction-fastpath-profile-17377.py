from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    function screenJurisdictionCandidate16539(candidate16539){
      if(focusMode||!jurisdictionGeometry16539)return candidate16539;"""
new="""    let jurisdictionFastInside17377=0,jurisdictionFastOutside17377=0,jurisdictionFallback17377=0,
        jurisdictionTouchMs17377=0,jurisdictionPipMs17377=0,jurisdictionFallbackMs17377=0;
    function screenJurisdictionCandidate16539(candidate16539){
      if(focusMode||!jurisdictionGeometry16539)return candidate16539;"""
if s.count(old)!=1: raise SystemExit("screen start anchor")
s=s.replace(old,new,1)
old="""      if(jurisdictionBoundaryIndex17373&&sourceSegment17373.length>=2&&!jurisdictionSegmentsTouchBoundary17373(sourceSegment17373)){
        const probe17373=sourceSegment17373[Math.floor((sourceSegment17373.length-1)/2)];
        if(!earthlinePointInJurisdiction16539(probe17373,jurisdictionFastGeometry17373)){"""
new="""      const touchStart17377=performance.now();
      const touches17377=jurisdictionBoundaryIndex17373&&sourceSegment17373.length>=2
        ?jurisdictionSegmentsTouchBoundary17373(sourceSegment17373):true;
      jurisdictionTouchMs17377+=performance.now()-touchStart17377;
      if(jurisdictionBoundaryIndex17373&&sourceSegment17373.length>=2&&!touches17377){
        const probe17373=sourceSegment17373[Math.floor((sourceSegment17373.length-1)/2)];
        const pipStart17377=performance.now();
        const inside17377=earthlinePointInJurisdiction16539(probe17373,jurisdictionFastGeometry17373);
        jurisdictionPipMs17377+=performance.now()-pipStart17377;
        if(!inside17377){jurisdictionFastOutside17377++;"""
if s.count(old)!=1: raise SystemExit("fast branch anchor")
s=s.replace(old,new,1)
old="""        const accepted17373=Object.assign({},candidate16539,{"""
new="""        jurisdictionFastInside17377++;
        const accepted17373=Object.assign({},candidate16539,{"""
if s.count(old)!=1: raise SystemExit("fast accept anchor")
s=s.replace(old,new,1)
old="""      const runs16539=(jurisdictionGeometry16539&&jurisdictionGeometry16539.earthlineVermontExactClip16750===true&&typeof window.earthlineClipVermontLine16178==='function')
        ?window.earthlineClipVermontLine16178(sourceSegment17373,jurisdictionGeometry16539.earthlineVermontGeometry16750)
        :earthlineClipLine16539(sourceSegment17373,jurisdictionGeometry16539);"""
new="""      jurisdictionFallback17377++;
      const fallbackStart17377=performance.now();
      const runs16539=(jurisdictionGeometry16539&&jurisdictionGeometry16539.earthlineVermontExactClip16750===true&&typeof window.earthlineClipVermontLine16178==='function')
        ?window.earthlineClipVermontLine16178(sourceSegment17373,jurisdictionGeometry16539.earthlineVermontGeometry16750)
        :earthlineClipLine16539(sourceSegment17373,jurisdictionGeometry16539);
      jurisdictionFallbackMs17377+=performance.now()-fallbackStart17377;"""
if s.count(old)!=1: raise SystemExit("fallback anchor")
s=s.replace(old,new,1)
anchor="""    const jurisdictionEligibleCandidates16539=candidates.length;"""
ins="""    const jurisdictionEligibleCandidates16539=candidates.length;
    (window.EARTHLINE_JURISDICTION_SCREEN_PROFILE_17377||(window.EARTHLINE_JURISDICTION_SCREEN_PROFILE_17377=[])).push({
      w:hy&&hy.w,h:hy&&hy.h,candidates:candidatesBeforeJurisdiction16539,eligible:jurisdictionEligibleCandidates16539,
      fastInside:jurisdictionFastInside17377,fastOutside:jurisdictionFastOutside17377,fallback:jurisdictionFallback17377,
      touchMs:Math.round(jurisdictionTouchMs17377),pipMs:Math.round(jurisdictionPipMs17377),fallbackMs:Math.round(jurisdictionFallbackMs17377)
    });"""
if s.count(anchor)!=1: raise SystemExit("profile emit anchor")
s=s.replace(anchor,ins,1)
p.write_text(s,encoding="utf-8")
print("instrumented jurisdiction fastpath 17377")
