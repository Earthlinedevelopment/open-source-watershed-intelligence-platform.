from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

# One authoritative user action for the existing Property button.
# On the same click, resync an unranked target from the visible crosshair/map center,
# record explicit user intent, and invoke the existing governed Property owner exactly once.
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
    if(window.EARTHLINE_PROPERTY_ONE_CLICK_ACTIVE_17265===true)return false;
    const governed=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof governed!=='function'){
      try{if(typeof earthlineReady==='function')earthlineReady('PROPERTY ANALYSIS BLOCKED — governed property controller is unavailable.')}catch(_){}
      return false;
    }
    try{
      if(typeof window.earthlineMarkExplicitAnalysisIntent16325==='function')window.earthlineMarkExplicitAnalysisIntent16325('earthlineDeclareProperty16169','click-17265');
      else if(typeof earthlineMarkExplicitAnalysisIntent16325==='function')earthlineMarkExplicitAnalysisIntent16325('earthlineDeclareProperty16169','click-17265');
    }catch(_){}
    let target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const ranked=!!String(target&&target.code||'').trim();
    if(!ranked){
      try{
        const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=mp&&mp.getCenter&&mp.getCenter();
        if(c&&Number.isFinite(Number(c.lng))&&Number.isFinite(Number(c.lat))){
          const next={lng:Number(c.lng),lat:Number(c.lat),source:'crosshair-click-17265',code:'',score:0,parentRunToken:String(target&&target.parentRunToken||''),query:String(target&&target.query||''),at:new Date().toISOString()};
          if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(next,{openPanel:false});
          else window.EARTHLINE_PROPERTY_TARGET_16201=next;
          target=window.EARTHLINE_PROPERTY_TARGET_16201||next;
        }
      }catch(_){}
    }
    const hasTarget=!!(target&&Number.isFinite(Number(target.lng))&&Number.isFinite(Number(target.lat)));
    if(hasTarget){
      window.EARTHLINE_PROPERTY_TARGET_16201=Object.assign({},target,{at:new Date().toISOString(),source:ranked?'corridor-direct-property-16254':String(target.source||'crosshair-click-17265')});
    }
    window.EARTHLINE_PROPERTY_ONE_CLICK_ACTIVE_17265=true;
    window.EARTHLINE_PROPERTY_ONE_CLICK_AUDIT_17265={build:'EARTHLINE 17265',startedAt:new Date().toISOString(),target:window.EARTHLINE_PROPERTY_TARGET_16201||null,ranked};
    try{
      const result=await Promise.resolve(governed(e));
      window.EARTHLINE_PROPERTY_ONE_CLICK_AUDIT_17265=Object.assign({},window.EARTHLINE_PROPERTY_ONE_CLICK_AUDIT_17265,{settledAt:new Date().toISOString(),result:result!==false});
      return result;
    }finally{window.EARTHLINE_PROPERTY_ONE_CLICK_ACTIVE_17265=false}
  }
  window.earthlinePropertyOneClick17265=declareProperty;
"""
if s.count(old)!=1:
    raise SystemExit("declareProperty anchor count "+str(s.count(old)))
s=s.replace(old,new,1)

old2="""if(property){property.onclick=function(ev){const fn=window.earthlineDeclarePropertyAtCrosshair16173;return typeof fn==='function'?fn(ev):false};"""
new2="""if(property){property.onclick=function(ev){const fn=window.earthlinePropertyOneClick17265||window.earthlineDeclarePropertyAtCrosshair16173;return typeof fn==='function'?fn(ev):false};"""
if s.count(old2)!=1:
    raise SystemExit("panel onclick anchor count "+str(s.count(old2)))
s=s.replace(old2,new2,1)

# Make the explicit-intent function available to the authoritative click wrapper too.
old3="""function earthlineMarkExplicitAnalysisIntent16325(source,eventType){
  window.EARTHLINE_EXPLICIT_ANALYSIS_INTENT_16325={"""
new3="""function earthlineMarkExplicitAnalysisIntent16325(source,eventType){
  window.EARTHLINE_EXPLICIT_ANALYSIS_INTENT_16325={"""
# Function declaration is already global in the current document. Keep source unchanged,
# but assert it exists so the one-click patch fails closed if architecture changes.
if old3 not in s:
    raise SystemExit("explicit intent owner anchor missing")

marker="<!-- EARTHLINE_PROPERTY_ONE_CLICK_17265: one physical Property button click owns target sync + explicit intent + exactly one governed Property launch. -->\n"
if marker not in s:
    s=marker+s
p.write_text(s,encoding="utf-8")

assert s.count("window.earthlinePropertyOneClick17265=declareProperty;")==1
assert s.count("crosshair-click-17265")>=2
print("EARTHLINE_PROPERTY_ONE_CLICK_17265_PATCHED")
