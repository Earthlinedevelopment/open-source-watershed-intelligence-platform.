from pathlib import Path

# Patch exact current live files after workflow overlays them.
p=Path("index.html")
s=p.read_text(encoding="utf-8")

# 1) Property candidate coverage: preserve opportunity across all contour levels.
old="""    const primaryLimit15836=Math.min(work15771.maxCandidates,Math.max(1,canonicalPaths15836.length));"""
new="""    const contourReserve17233=isRegionalTile15769?0:Math.min(levels.length,Math.max(0,work15771.maxCandidates-1));
    const primaryLimit15836=Math.min(
      Math.max(0,work15771.maxCandidates-contourReserve17233),
      Math.max(1,canonicalPaths15836.length)
    ); /* EARTHLINE_PROPERTY_FULL_LEVEL_COVERAGE_17233 */"""
if s.count(old)!=1: raise SystemExit("primaryLimit anchor "+str(s.count(old)))
s=s.replace(old,new,1)

old="""      const seeds=selectedSeeds15841.slice(0,work15771.maxSeedsPerLevel);
      /* BUILD-CHECK-15803-DIAGNOSTIC-BEGIN */"""
new="""      const seeds=selectedSeeds15841.slice(0,work15771.maxSeedsPerLevel);
      const remainingLevels17233=Math.max(1,levels.length-li);
      const remainingSlots17233=Math.max(0,work15771.maxCandidates-swales.length);
      const levelCandidateBudget17233=isRegionalTile15769
        ? work15771.perLevel
        : Math.max(0,Math.min(work15771.perLevel,Math.ceil(remainingSlots17233/remainingLevels17233)));
      /* BUILD-CHECK-15803-DIAGNOSTIC-BEGIN */"""
if s.count(old)!=1: raise SystemExit("seed budget anchor "+str(s.count(old)))
s=s.replace(old,new,1)
if s.count("if(acceptedAtLevel>=work15771.perLevel)break;")<2: raise SystemExit("perLevel break anchors missing")
s=s.replace("if(acceptedAtLevel>=work15771.perLevel)break;","if(acceptedAtLevel>=levelCandidateBudget17233)break;",2)

# 2) One-click Property owner. Existing panel reconciliation must use the same wrapper,
# never bypass it with a stale direct terminal call.
old="""  async function declareProperty(e){
    e?.preventDefault?.();e?.stopPropagation?.();e?.stopImmediatePropagation?.();
    const governed=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof governed!=='function'){
      try{if(typeof earthlineReady==='function')earthlineReady('PROPERTY ANALYSIS BLOCKED — governed property controller is unavailable.')}catch(_){}
      return false;
    }
    const target=window.EARTHLINE_PROPERTY_TARGET_16201;
    const hasTarget=!!(target&&Number.isFinite(Number(target.lng))&&Number.isFinite(Number(target.lat)));
    if(hasTarget){
      /* EARTHLINE 16254 — direct Property handoff. Do not launch a 3 km Focus
         analysis first and do not move the camera here. The preserved terminal
         Property owner below declares the 20-acre Property state before it moves
         the camera, then runs the authoritative terrain/exclusion/swale pipeline. */
      window.EARTHLINE_PROPERTY_TARGET_16201=Object.assign({},target,{at:new Date().toISOString(),source:target.code?'corridor-direct-property-16254':String(target.source||'crosshair')});
    }
    return await Promise.resolve(governed(e));
  }
"""
new="""  async function declareProperty(e){
    e?.preventDefault?.();e?.stopPropagation?.();e?.stopImmediatePropagation?.();
    if(window.EARTHLINE_PROPERTY_ONE_CLICK_ACTIVE_17267===true)return false;
    const governed=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof governed!=='function'){
      try{if(typeof earthlineReady==='function')earthlineReady('PROPERTY ANALYSIS BLOCKED — governed property controller is unavailable.')}catch(_){}
      return false;
    }
    let target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const ranked=!!String(target&&target.code||'').trim();
    if(!ranked){
      try{
        const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=mp&&mp.getCenter&&mp.getCenter();
        if(c&&Number.isFinite(Number(c.lng))&&Number.isFinite(Number(c.lat))){
          const next={lng:Number(c.lng),lat:Number(c.lat),source:'crosshair-click-17267',code:'',score:0,parentRunToken:String(target&&target.parentRunToken||''),query:String(target&&target.query||''),at:new Date().toISOString()};
          if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(next,{openPanel:false});
          else window.EARTHLINE_PROPERTY_TARGET_16201=next;
          target=window.EARTHLINE_PROPERTY_TARGET_16201||next;
        }
      }catch(_){}
    }
    const hasTarget=!!(target&&Number.isFinite(Number(target.lng))&&Number.isFinite(Number(target.lat)));
    if(hasTarget)window.EARTHLINE_PROPERTY_TARGET_16201=Object.assign({},target,{at:new Date().toISOString(),source:ranked?'corridor-direct-property-16254':String(target.source||'crosshair-click-17267')});
    window.EARTHLINE_PROPERTY_ONE_CLICK_ACTIVE_17267=true;
    window.EARTHLINE_PROPERTY_ONE_CLICK_AUDIT_17267={build:'EARTHLINE 17267',startedAt:new Date().toISOString(),target:window.EARTHLINE_PROPERTY_TARGET_16201||null,ranked};
    try{
      const result=await Promise.resolve(governed(e));
      window.EARTHLINE_PROPERTY_ONE_CLICK_AUDIT_17267=Object.assign({},window.EARTHLINE_PROPERTY_ONE_CLICK_AUDIT_17267,{settledAt:new Date().toISOString(),result:result!==false});
      return result;
    }finally{window.EARTHLINE_PROPERTY_ONE_CLICK_ACTIVE_17267=false}
  }
  window.earthlinePropertyOneClick17267=declareProperty;
"""
if s.count(old)!=1: raise SystemExit("declareProperty anchor "+str(s.count(old)))
s=s.replace(old,new,1)

old2="""if(property){property.onclick=function(ev){const fn=window.earthlineDeclarePropertyAtCrosshair16173;return typeof fn==='function'?fn(ev):false};"""
new2="""if(property){property.onclick=function(ev){const fn=window.earthlinePropertyOneClick17267||window.earthlineDeclarePropertyAtCrosshair16173;return typeof fn==='function'?fn(ev):false};"""
if s.count(old2)!=1: raise SystemExit("panel onclick anchor "+str(s.count(old2)))
s=s.replace(old2,new2,1)

marker="<!-- EARTHLINE_STABILITY_HOTFIX_17267: one-click Property + full-level Property candidate coverage. -->\n"
s=marker+s
p.write_text(s,encoding="utf-8")

# 3) Elder repeat-run race. Pointerdown was priming using the previous target before
# the click owner re-synced the crosshair. The governed Property owner already calls
# startProperty after the new declaration exists, so remove only the redundant race.
jp=Path("earthline-launch-16872.js")
j=jp.read_text(encoding="utf-8")
oldj="""    document.addEventListener('pointerdown',e=>{
      const b=e.target?.closest?.('#earthlineDeclareProperty16169');
      if(!b||b.disabled)return;
      schedulePropertyPrime17212();
    },true);
"""
newj="""    /* EARTHLINE_ELDER_REPEAT_TARGET_17267 — governed Property launch owns Elder start
       after the new target/declaration is committed. Do not prime on pointerdown,
       which can capture the previous Property target on repeat searches. */
"""
if j.count(oldj)!=1: raise SystemExit("elder pointerdown anchor "+str(j.count(oldj)))
j=j.replace(oldj,newj,1)
jp.write_text(j,encoding="utf-8")

assert "EARTHLINE_PROPERTY_FULL_LEVEL_COVERAGE_17233" in s
assert "window.earthlinePropertyOneClick17267=declareProperty;" in s
assert "EARTHLINE_ELDER_REPEAT_TARGET_17267" in j
print("EARTHLINE_STABILITY_HOTFIX_17267_PATCHED")
