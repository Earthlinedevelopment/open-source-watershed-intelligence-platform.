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
    /* EARTHLINE 17697 — one bounded presentation handoff, not a polling owner.
       GeoJSON source/layers are already committed; allow two browser frames for
       Mapbox to paint them before the authoritative rendered-feature check. */
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const second=syncSafePropertyFallback16221('terminal-after-two-frames-17697');
    return {...second,required:true,pending:!(second&&second.ok===true)};
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

if s.count(old_verify)!=1:
    raise SystemExit(f"verify block count {s.count(old_verify)}")
if s.count(old_release)!=1:
    raise SystemExit(f"release block count {s.count(old_release)}")

s=s.replace(old_verify,new_verify)
s=s.replace(old_release,new_release)
p.write_text(s)

assert "EARTHLINE 17697" in s
assert "EARTHLINE 17698" in s
assert s.count("running=false;\n      document.documentElement.dataset.earthlinePropertyRunState='idle';") == 0
print("EARTHLINE_IOWA_RENDER_HANDOFF_PATCH_OK")
