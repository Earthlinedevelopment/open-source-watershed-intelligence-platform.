from pathlib import Path

p=Path("index.html")
s=p.read_text(errors="strict")

old_verify="""  async function verifySafePropertyFallback16221(count){
    if(!(count>0))return {ok:true,count:0,visible:false,required:false,pending:false};
    const first=syncSafePropertyFallback16221('terminal-atomic-17670');
    return {...first,required:true,pending:false};
  }"""
new_verify="""  async function verifySafePropertyFallback16221(count){
    if(!(count>0))return {ok:true,count:0,visible:false,required:false,pending:false};
    const first=syncSafePropertyFallback16221('terminal-atomic-17670');
    if(first&&first.ok===true)return {...first,required:true,pending:false};
    /* EARTHLINE 17697 — bounded source-readiness handoff, not polling.
       The safe GeoJSON is already committed. If Mapbox is still processing that
       source, wait once for its own sourcedata signal (or the bounded fallback),
       then allow two paint frames before the rendered-feature truth check. */
    const mp=map();
    if(mp&&typeof mp.isSourceLoaded==='function'&&!mp.isSourceLoaded(SAFE_SOURCE_16221)){
      await new Promise(resolve=>{
        let done=false;
        const finish=()=>{if(done)return;done=true;try{mp.off?.('sourcedata',onSource)}catch(_){};resolve()};
        const onSource=e=>{if(String(e&&e.sourceId||'')===SAFE_SOURCE_16221&&e?.isSourceLoaded===true)finish()};
        try{mp.on?.('sourcedata',onSource)}catch(_){}
        setTimeout(finish,1200);
      });
    }
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const second=syncSafePropertyFallback16221('terminal-after-source-ready-17697');
    return {...second,required:true,pending:!(second&&second.ok===true)};
  }"""

old_settle="""  function settlePropertyMapVisibility16260(count,texture,serial){
    if(!(count>0)||texture?.ok)return true;
    if(serial!==runSerial)return false;
    const living=propertyLivingMapVisible16262(count);
    const safe=syncSafePropertyFallback16221('post-terminal-atomic-17670');
    const ok=!!(living.ok||safe?.ok);
    const current=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    setAudit({
      settled:true,result:true,corridors:count,
      renderVerified:ok,renderPending:false,
      renderMode:living.ok?living.mode:(safe?.ok?'authoritative-safe-lines':'presentation-unavailable'),
      mapEvidence:living.ok?living:null,safeFallback:safe||null,texture,
      currentScientificResultPreserved:true,
      mapVerificationSettledAt:new Date().toISOString(),
      settledAt:current.settledAt||new Date().toISOString()
    });
    if(!ok){
      status('PROPERTY RESULT PRESERVED — '+count+' corridor'+(count===1?' was':'s were')+' found, but the map presentation did not verify. No substitute geometry was drawn.','failed');
      setTierNotice('warning','PROPERTY DETAIL · ANALYSIS PRESERVED · MAP PRESENTATION UNAVAILABLE');
    }
    return ok;
  }"""
new_settle="""  function settlePropertyMapVisibility16260(count,texture,serial){
    if(!(count>0)||texture?.ok)return true;
    if(serial!==runSerial)return false;
    const living=propertyLivingMapVisible16262(count);
    const safe=syncSafePropertyFallback16221('post-terminal-atomic-17670');
    const ok=!!(living.ok||safe?.ok);
    const current=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    setAudit({
      settled:ok,result:true,corridors:count,
      renderVerified:ok,renderPending:!ok,
      renderMode:living.ok?living.mode:(safe?.ok?'authoritative-safe-lines':'pending-authoritative-safe-lines'),
      mapEvidence:living.ok?living:null,safeFallback:safe||null,texture,
      currentScientificResultPreserved:true,
      mapVerificationSettledAt:ok?new Date().toISOString():null,
      settledAt:ok?(current.settledAt||new Date().toISOString()):null
    });
    if(!ok){
      status('PROPERTY RESULT PRESERVED — '+count+' corridor'+(count===1?' was':'s were')+' found, but the authoritative Property map layer is not yet verified. Regional geometry is not a valid substitute.','failed');
      setTierNotice('warning','PROPERTY DETAIL · ANALYSIS PRESERVED · PROPERTY MAP NOT VERIFIED');
    }
    return ok;
  }"""

old_release="""      /* EARTHLINE 16334 — verified science is the interactive terminal. Optional
         presentation verification continues, but the Property control is released now. */
      running=false;
      document.documentElement.dataset.earthlinePropertyRunState='idle';
      document.documentElement.classList.remove('earthline-property-running-16233');
      clearTimers();setButton(false);clearAllBusy();restoreGrab();
      try{window.getSelection?.()?.removeAllRanges?.();button()?.blur?.()}catch(_){}

      /* EARTHLINE 17187 — frame the already-selected Property before the first authoritative safe-swale visibility check. This reorders the existing frame owner only; geometry, hydrology, styles and lifecycle ownership are unchanged. */"""
new_release="""      /* EARTHLINE 17698 — science may be terminal, but Property is not visually
         terminal until the authoritative Property layer completes its first bounded
         presentation verification. The single governed owner remains active here;
         final cleanup still occurs in terminalPropertyRun's existing finally block. */

      /* EARTHLINE 17187 — frame the already-selected Property before the first authoritative safe-swale visibility check. This reorders the existing frame owner only; geometry, hydrology, styles and lifecycle ownership are unchanged. */"""

for label,old,new in [
    ("verify",old_verify,new_verify),
    ("settle",old_settle,new_settle),
    ("release",old_release,new_release),
]:
    if s.count(old)!=1:
        raise SystemExit(f"{label} block count {s.count(old)}")
    s=s.replace(old,new)

p.write_text(s)

assert "EARTHLINE 17697" in s
assert "EARTHLINE 17698" in s
assert "settled:ok,result:true,corridors:count" in s
print("EARTHLINE_IOWA_RENDER_HANDOFF_PATCH_OK")
