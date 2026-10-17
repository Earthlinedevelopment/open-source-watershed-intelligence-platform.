from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="m.on('moveend',()=>{syncPropertyTargetFromMap16201();positionSuggestions16233()});"
new="m.on('moveend',()=>{/* EARTHLINE 17424 — programmatic camera motion must not rewrite the committed Property target. User pan ownership is already handled by dragend above. */positionSuggestions16233()});"
if s.count(old)!=1:
    raise SystemExit(f"moveend target owner anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_PROPERTY_TARGET_USER_DRAG_ONLY_17424: Property target moves on user drag, not programmatic moveend. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched Property target ownership dragend-only 17424")
