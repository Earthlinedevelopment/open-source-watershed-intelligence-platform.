from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE M78.39 — physical Property press latches immutable target into terminal owner"
if marker in s:
    raise SystemExit(0)

old_sig="  async function terminalPropertyRun(ev){"
new_sig="""  async function terminalPropertyRun(ev,acceptedTargetM7839){
    /* EARTHLINE M78.39 — physical Property press latches immutable target into terminal owner.
       Mutable moveend/crosshair reconciliation may continue for presentation, but it can no
       longer change the Property target after an accepted press. The existing terminal owner
       remains the sole Property lifecycle/science/publication owner. */"""
if s.count(old_sig)!=1:
    raise SystemExit(f"M78.39 terminal signature anchor count={s.count(old_sig)}")
s=s.replace(old_sig,new_sig,1)

old_chosen="""    const mp=map(),m=model(),chosen=window.EARTHLINE_PROPERTY_TARGET_16201,c=(chosen&&Number.isFinite(Number(chosen.lng))&&Number.isFinite(Number(chosen.lat)))?{lng:Number(chosen.lng),lat:Number(chosen.lat)}:mp?.getCenter?.();"""
new_chosen="""    const mp=map(),m=model(),liveTargetM7839=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const latchedTargetM7839=(acceptedTargetM7839&&Number.isFinite(Number(acceptedTargetM7839.lng))&&Number.isFinite(Number(acceptedTargetM7839.lat)))
      ?Object.freeze(Object.assign({},acceptedTargetM7839)):null;
    const chosen=latchedTargetM7839||liveTargetM7839;
    if(latchedTargetM7839){
      window.EARTHLINE_PROPERTY_ACCEPTED_TARGET_M7839=latchedTargetM7839;
      window.EARTHLINE_PROPERTY_TARGET_16201=Object.assign({},latchedTargetM7839,{at:new Date().toISOString(),source:String(latchedTargetM7839.source||'crosshair')});
    }
    const c=(chosen&&Number.isFinite(Number(chosen.lng))&&Number.isFinite(Number(chosen.lat)))?{lng:Number(chosen.lng),lat:Number(chosen.lat)}:mp?.getCenter?.();"""
if s.count(old_chosen)!=1:
    raise SystemExit(f"M78.39 chosen anchor count={s.count(old_chosen)}")
s=s.replace(old_chosen,new_chosen,1)

old_acc="    const acceptedM7832=window.EARTHLINE_PROPERTY_TARGET_16201||null;"
new_acc="    const acceptedM7832=chosen||window.EARTHLINE_PROPERTY_TARGET_16201||null;"
if s.count(old_acc)!=1:
    raise SystemExit(f"M78.39 M78.32 anchor count={s.count(old_acc)}")
s=s.replace(old_acc,new_acc,1)

old_activation="""    const fn=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof fn!=='function')return false;
    const serialBefore17494=Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0);"""
new_activation="""    const fn=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof fn!=='function')return false;
    const targetAtPressM7839=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const acceptedTargetM7839=(targetAtPressM7839&&Number.isFinite(Number(targetAtPressM7839.lng))&&Number.isFinite(Number(targetAtPressM7839.lat)))
      ?Object.freeze(Object.assign({},targetAtPressM7839,{acceptedAt:new Date().toISOString()})):null;
    if(!acceptedTargetM7839)return false;
    window.EARTHLINE_PROPERTY_ACCEPTED_TARGET_M7839=acceptedTargetM7839;
    const serialBefore17494=Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0);"""
if s.count(old_activation)!=1:
    raise SystemExit(f"M78.39 activation anchor count={s.count(old_activation)}")
s=s.replace(old_activation,new_activation,1)

old_call="    try{out17499=fn()}catch(_){"
new_call="    try{out17499=fn(ev,acceptedTargetM7839)}catch(_){"
if s.count(old_call)!=1:
    raise SystemExit(f"M78.39 activation call anchor count={s.count(old_call)}")
s=s.replace(old_call,new_call,1)

# The older fallback declareProperty path also passes its current accepted snapshot directly.
old_fallback="    return await Promise.resolve(governed(e));"
new_fallback="""    const acceptedFallbackM7839=(window.EARTHLINE_PROPERTY_TARGET_16201&&Number.isFinite(Number(window.EARTHLINE_PROPERTY_TARGET_16201.lng))&&Number.isFinite(Number(window.EARTHLINE_PROPERTY_TARGET_16201.lat)))
      ?Object.freeze(Object.assign({},window.EARTHLINE_PROPERTY_TARGET_16201,{acceptedAt:new Date().toISOString()})):null;
    return await Promise.resolve(governed(e,acceptedFallbackM7839));"""
if s.count(old_fallback)!=1:
    raise SystemExit(f"M78.39 fallback call anchor count={s.count(old_fallback)}")
s=s.replace(old_fallback,new_fallback,1)

if marker not in s:
    raise SystemExit("M78.39 marker missing after repair")
p.write_text(s,encoding="utf-8")
print("Applied M78.39 immutable accepted-target handoff")
