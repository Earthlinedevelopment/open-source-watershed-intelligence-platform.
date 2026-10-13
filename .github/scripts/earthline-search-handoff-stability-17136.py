from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_pos="""function positionSuggestions16233(){const input=document.getElementById('searchInput'),menu=document.getElementById('earthlineSearchSuggestions15970');if(!input||!menu)return;const r=input.closest('.searchbox')?.getBoundingClientRect()||input.getBoundingClientRect();menu.style.left=Math.round(r.left)+'px';menu.style.top=Math.round(r.bottom+7)+'px';menu.style.width=Math.round(r.width)+'px'}"""
new_pos="""function positionSuggestions16233(){const input=document.getElementById('searchInput'),menu=document.getElementById('earthlineSearchSuggestions15970');if(!input||!menu)return;const r=input.closest('.searchbox')?.getBoundingClientRect()||input.getBoundingClientRect(),run=document.getElementById('runBtn'),rr=run?.getBoundingClientRect?.(),bottom=rr&&rr.width>0&&rr.height>0?Math.max(r.bottom,rr.bottom):r.bottom;menu.style.left=Math.round(r.left)+'px';menu.style.top=Math.round(bottom+7)+'px';menu.style.width=Math.round(r.width)+'px'}"""
if s.count(old_pos)!=1:
    raise SystemExit(f"Expected one search suggestion position owner, found {s.count(old_pos)}")
s=s.replace(old_pos,new_pos,1)

old_sync="""function syncPropertyTargetFromMap16201(){const m=panelMap16188();if(!m||typeof m.getCenter!=='function')return false;const c=m.getCenter();if(!c||!Number.isFinite(Number(c.lng))||!Number.isFinite(Number(c.lat)))return false;const existing=window.EARTHLINE_PROPERTY_TARGET_16201;
  if(existing&&existing.source==='country-center'&&window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845&&window.EARTHLINE_COUNTRY_TARGET_LOCK_16845!==false)return true;if(existing&&existing.code)return true;return setPropertyTarget16201({lng:Number(c.lng),lat:Number(c.lat),source:'crosshair'},{openPanel:false})}"""
new_sync="""function syncPropertyTargetFromMap16201(){const m=panelMap16188();if(!m||typeof m.getCenter!=='function')return false;const c=m.getCenter();if(!c||!Number.isFinite(Number(c.lng))||!Number.isFinite(Number(c.lat)))return false;const existing=window.EARTHLINE_PROPERTY_TARGET_16201;
  if(existing&&existing.source==='country-center'&&window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845&&window.EARTHLINE_COUNTRY_TARGET_LOCK_16845!==false)return true;
  const lng=Number(c.lng),lat=Number(c.lat),same=!!(existing&&Math.abs(Number(existing.lng)-lng)<1e-7&&Math.abs(Number(existing.lat)-lat)<1e-7&&!existing.code);
  if(same)return true;
  return setPropertyTarget16201({lng,lat,source:existing&&existing.code?'crosshair-corridor-zoom-17136':'crosshair'},{openPanel:false})}"""
if s.count(old_sync)!=1:
    raise SystemExit(f"Expected one Property map-target sync owner, found {s.count(old_sync)}")
s=s.replace(old_sync,new_sync,1)

p.write_text(s,encoding="utf-8")

q=p.read_text(encoding="utf-8")
assert new_pos in q
assert new_sync in q
assert old_pos not in q
assert "if(existing&&existing.code)return true" not in q[q.find("function syncPropertyTargetFromMap16201"):q.find("function syncPropertyTargetFromMap16201")+1000]
print("17136 search/handoff candidate contract PASS")
