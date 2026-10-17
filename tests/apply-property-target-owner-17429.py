from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_sync="""function syncPropertyTargetFromMap16201(){const m=panelMap16188();if(!m||typeof m.getCenter!=='function')return false;const c=m.getCenter();"""
new_sync="""function syncPropertyTargetFromMap16201(){if(String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running')return true;const m=panelMap16188();if(!m||typeof m.getCenter!=='function')return false;const c=m.getCenter();"""
if s.count(old_sync)!=1: raise SystemExit(f"sync target anchor count {s.count(old_sync)}")
s=s.replace(old_sync,new_sync,1)

old_move="""m.on('moveend',()=>{syncPropertyTargetFromMap16201();positionSuggestions16233()});"""
new_move="""m.on('moveend',()=>{positionSuggestions16233()});"""
if s.count(old_move)!=1: raise SystemExit(f"generic moveend target owner count {s.count(old_move)}")
s=s.replace(old_move,new_move,1)

s="<!-- EARTHLINE_PROPERTY_TARGET_17429: user drag owns target changes; generic/programmatic moveend cannot rewrite the committed 20-acre target. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched Property target ownership 17429")
