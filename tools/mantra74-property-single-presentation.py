from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
before=s

def must_replace(old,new,label):
    global s
    n=s.count(old)
    if n!=1:
        raise RuntimeError(f"{label}: expected 1 occurrence, found {n}")
    s=s.replace(old,new,1)

# Remove timer collection.
must_replace(
"  const SAFE_EMPTY_16221={type:'FeatureCollection',features:[]};\n  const safeLayerTimers16221=new Set();\n",
"  const SAFE_EMPTY_16221={type:'FeatureCollection',features:[]};\n",
"safe timer collection"
)

# Slow the UI-only elapsed clock; science does not need 4 DOM writes/sec.
must_replace(
"    },250);\n  }\n  function declaredSite(center){",
"    },1000);\n  }\n  function declaredSite(center){",
"stage clock cadence"
)

# One-shot safe presentation only.
start="  function scheduleSafePropertyFallback16221(reason='scheduled'){"
end="  async function verifySafePropertyFallback16221(count){"
a=s.find(start); b=s.find(end,a)
if a<0 or b<0: raise RuntimeError("safe retry block markers missing")
s=s[:a]+'''  function scheduleSafePropertyFallback16221(reason='scheduled'){
    /* EARTHLINE 17670 — deterministic presentation. No retry ladder. */
    return syncSafePropertyFallback16221(reason);
  }
'''+s[b:]

old='''  async function verifySafePropertyFallback16221(count){
    if(!(count>0))return {ok:true,count:0,visible:false,required:false,pending:false};
    /* EARTHLINE 16260 — presentation verification is non-blocking.
       The scientific Property result has already committed before this point.
       One immediate visibility check is allowed inside the governed promise;
       if Mapbox is still settling, the exact existing safe-layer owner retries
       after terminal state instead of holding the Property Orb/run open. */
    const first=syncSafePropertyFallback16221('terminal-immediate-16260');
    if(first.ok)return {...first,required:true,pending:false};
    scheduleSafePropertyFallback16221('terminal-background-16260');
    return {...first,ok:false,count,visible:false,required:true,pending:true};
  }
'''
new='''  async function verifySafePropertyFallback16221(count){
    if(!(count>0))return {ok:true,count:0,visible:false,required:false,pending:false};
    const first=syncSafePropertyFallback16221('terminal-atomic-17670');
    return {...first,required:true,pending:false};
  }
'''
must_replace(old,new,"safe fallback verifier")

# Display proof controller is gone. Renderer state is the sole display evidence.
start="  function propertyLivingMapVisible16262(count){"
end="  function settlePropertyMapVisibility16260(count,texture,serial){"
a=s.find(start); b=s.find(end,a)
if a<0 or b<0: raise RuntimeError("living visibility markers missing")
s=s[:a]+'''  function propertyLivingMapVisible16262(count){
    try{
      const m=model()||{},renderer=m.livingSwaleRenderer15792||null;
      if(renderer&&renderer.visible===true&&renderer.sourceReady===true&&Number(renderer.features||0)>0){
        return {ok:true,mode:'living-swales-15792-state',count:Number(renderer.features||0),renderer};
      }
    }catch(_){ }
    return {ok:false,count:Number(count||0)};
  }

'''+s[b:]

# Replace six-delay post-terminal settlement with one deterministic observation.
start="  function settlePropertyMapVisibility16260(count,texture,serial){"
end="  function earthlinePropertyLaunchAudit16322"
a=s.find(start); b=s.find(end,a)
if a<0 or b<0: raise RuntimeError("post-terminal settle markers missing")
s=s[:a]+'''  function settlePropertyMapVisibility16260(count,texture,serial){
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
  }

'''+s[b:]

# Remove all background re-fire owners and build polling from install.
old="""    const mp=map();if(mp?.on)for(const ev of ['load','style.load','zoomend','moveend'])mp.on(ev,()=>scheduleSafePropertyFallback16221('map-'+ev));
    document.addEventListener('earthline:analysis-complete',()=>scheduleSafePropertyFallback16221('analysis-complete'),{passive:true});
    scheduleSafePropertyFallback16221('install');
"""
must_replace(old,"","background safe presentation owners")
must_replace("    setInterval(updateBuild,1000);\n","    updateBuild();\n","build polling")

# Assertions.
for bad in [
    "safeLayerTimers16221",
    "[0,90,260,620,1300,2600]",
    "for(const delay of [120,280,520,900,1300,1800])",
    "earthlineDisplayAudit15882",
    "mp.on(ev,()=>scheduleSafePropertyFallback16221",
    "analysis-complete',()=>scheduleSafePropertyFallback16221",
    "setInterval(updateBuild,1000)"
]:
    if bad in s:
        raise RuntimeError("late mutation owner remains: "+bad)

for good in [
    "function settleCurrentPropertyPresentation16521",
    "function syncSafePropertyFallback16221",
    "function propertyLivingMapVisible16262",
    "function settlePropertyMapVisibility16260",
    "window.earthlineDeclarePropertyAtCrosshair16173=terminalPropertyRun;"
]:
    if good not in s:
        raise RuntimeError("required current Property owner missing: "+good)

p.write_text(s.rstrip()+"\n",encoding="utf-8")
print("EARTHLINE_17670_PROPERTY_PRESENTATION_SINGLE_COMMIT",len(before),len(s),len(before)-len(s))

# trigger
