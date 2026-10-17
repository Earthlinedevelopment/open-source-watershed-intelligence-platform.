from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_button="""document.body.appendChild(b)}/* EARTHLINE 16546 — the existing single Property control always owns exactly one current click handler, even if another panel owner created or moved the button before this installer runs. Assignment replaces any stale onclick owner rather than stacking a listener. */b.onclick=declareProperty;b.dataset.earthlinePropertyClickOwner16546='current';return b}"""
new_button="""document.body.appendChild(b)}
  /* EARTHLINE 17428 — the existing Property control snapshots its already-committed
     crosshair target on the same physical press. No second run listener is added. */
  b.onpointerdown=function(e){
    e.stopPropagation();
    const t=window.EARTHLINE_PROPERTY_TARGET_16201;
    if(t&&Number.isFinite(Number(t.lng))&&Number.isFinite(Number(t.lat))){
      window.EARTHLINE_PROPERTY_POINTER_SNAPSHOT_17428={
        lng:Number(t.lng),lat:Number(t.lat),source:String(t.source||'crosshair'),
        code:t.code?String(t.code):'',score:Number(t.score||0),
        parentRunToken:t.parentRunToken?String(t.parentRunToken):'',
        pressedAt:Date.now(),at:new Date().toISOString()
      };
    }
  };
  /* EARTHLINE 16546 — the existing single Property control always owns exactly one current click handler, even if another panel owner created or moved the button before this installer runs. Assignment replaces any stale onclick owner rather than stacking a listener. */
  b.onclick=declareProperty;b.dataset.earthlinePropertyClickOwner16546='current';return b}"""
if s.count(old_button)!=1: raise SystemExit(f"button owner anchor count {s.count(old_button)}")
s=s.replace(old_button,new_button,1)

old_terminal="""    const mp=map(),m=model(),chosen=window.EARTHLINE_PROPERTY_TARGET_16201,c=(chosen&&Number.isFinite(Number(chosen.lng))&&Number.isFinite(Number(chosen.lat)))?{lng:Number(chosen.lng),lat:Number(chosen.lat)}:mp?.getCenter?.();
    if(!mp||!m||!c||!Number.isFinite(Number(c.lng))||!Number.isFinite(Number(c.lat))){status('PROPERTY ANALYSIS BLOCKED — map-crosshair coordinates are unavailable.','failed');return false}
"""
new_terminal="""    const mp=map(),m=model(),chosen=window.EARTHLINE_PROPERTY_TARGET_16201,pointer17428=window.EARTHLINE_PROPERTY_POINTER_SNAPSHOT_17428||null;
    const pointerValid17428=!!(pointer17428&&Number.isFinite(Number(pointer17428.lng))&&Number.isFinite(Number(pointer17428.lat))&&Date.now()-Number(pointer17428.pressedAt||0)<10000);
    const launchTarget17428=pointerValid17428?pointer17428:chosen;
    const c=(launchTarget17428&&Number.isFinite(Number(launchTarget17428.lng))&&Number.isFinite(Number(launchTarget17428.lat)))
      ?{lng:Number(launchTarget17428.lng),lat:Number(launchTarget17428.lat)}
      :mp?.getCenter?.();
    if(!mp||!m||!c||!Number.isFinite(Number(c.lng))||!Number.isFinite(Number(c.lat))){status('PROPERTY ANALYSIS BLOCKED — map-crosshair coordinates are unavailable.','failed');return false}
    if(pointerValid17428){
      window.EARTHLINE_PROPERTY_TARGET_16201=Object.assign({},chosen||{},pointer17428,{at:new Date().toISOString()});
      window.EARTHLINE_PROPERTY_CLICK_SNAPSHOT_17428={
        lng:Number(c.lng),lat:Number(c.lat),source:String(pointer17428.source||'crosshair'),
        code:pointer17428.code?String(pointer17428.code):'',at:new Date().toISOString()
      };
    }
"""
if s.count(old_terminal)!=1: raise SystemExit(f"terminal target anchor count {s.count(old_terminal)}")
s=s.replace(old_terminal,new_terminal,1)

old_sync="""function syncPropertyTargetFromMap16201(){const m=panelMap16188();if(!m||typeof m.getCenter!=='function')return false;const c=m.getCenter();"""
new_sync="""function syncPropertyTargetFromMap16201(){if(String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running')return true;const m=panelMap16188();if(!m||typeof m.getCenter!=='function')return false;const c=m.getCenter();"""
if s.count(old_sync)!=1: raise SystemExit(f"target sync anchor count {s.count(old_sync)}")
s=s.replace(old_sync,new_sync,1)

s="<!-- EARTHLINE_PROPERTY_ONE_PRESS_17428: same physical press snapshots immutable 20-acre target through governed Property run. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched authoritative one-press Property target 17428")
