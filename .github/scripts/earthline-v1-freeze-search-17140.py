from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

# 1) Search suggestion placement: make the existing installSearch owner authoritative
# and keep the menu below both the search box and Run Analysis.
old_menu="""function positionMenu16201(){const r=box.getBoundingClientRect(),w=Math.max(320,Math.min(620,window.innerWidth-r.left-18));menu.style.setProperty('left',r.left+'px','important');menu.style.setProperty('top',(r.bottom+8)+'px','important');menu.style.setProperty('width',w+'px','important');}"""
new_menu="""function positionMenu16201(){const r=box.getBoundingClientRect(),run=document.getElementById('runBtn'),rr=run?.getBoundingClientRect?.(),bottom=rr&&rr.width>0&&rr.height>0?Math.max(r.bottom,rr.bottom):r.bottom,w=Math.max(320,Math.min(620,window.innerWidth-r.left-18));menu.style.setProperty('left',r.left+'px','important');menu.style.setProperty('top',(bottom+8)+'px','important');menu.style.setProperty('width',w+'px','important');window.EARTHLINE_SEARCH_MENU_POSITION_17140={left:r.left,top:bottom+8,width:w,at:new Date().toISOString()};}window.earthlinePositionSearchMenu16201=positionMenu16201;"""
if s.count(old_menu)!=1:
    raise SystemExit(f"Expected one positionMenu16201 owner, found {s.count(old_menu)}")
s=s.replace(old_menu,new_menu,1)

old_secondary="""function positionSuggestions16233(){const input=document.getElementById('searchInput'),menu=document.getElementById('earthlineSearchSuggestions15970');if(!input||!menu)return;const r=input.closest('.searchbox')?.getBoundingClientRect()||input.getBoundingClientRect();menu.style.left=Math.round(r.left)+'px';menu.style.top=Math.round(r.bottom+7)+'px';menu.style.width=Math.round(r.width)+'px'}"""
new_secondary="""function positionSuggestions16233(){if(typeof window.earthlinePositionSearchMenu16201==='function')return window.earthlinePositionSearchMenu16201();const input=document.getElementById('searchInput'),menu=document.getElementById('earthlineSearchSuggestions15970');if(!input||!menu)return false}"""
if s.count(old_secondary)!=1:
    raise SystemExit(f"Expected one secondary suggestion writer, found {s.count(old_secondary)}")
s=s.replace(old_secondary,new_secondary,1)

# 2) Property target: after Regional Zoom or map movement, the map center owns the
# 20-acre target. Only the intentional country-center lock is preserved.
old_sync="""function syncPropertyTargetFromMap16201(){const m=panelMap16188();if(!m||typeof m.getCenter!=='function')return false;const c=m.getCenter();if(!c||!Number.isFinite(Number(c.lng))||!Number.isFinite(Number(c.lat)))return false;const existing=window.EARTHLINE_PROPERTY_TARGET_16201;
  if(existing&&existing.source==='country-center'&&window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845&&window.EARTHLINE_COUNTRY_TARGET_LOCK_16845!==false)return true;if(existing&&existing.code)return true;return setPropertyTarget16201({lng:Number(c.lng),lat:Number(c.lat),source:'crosshair'},{openPanel:false})}"""
new_sync="""function syncPropertyTargetFromMap16201(){const m=panelMap16188();if(!m||typeof m.getCenter!=='function')return false;const c=m.getCenter();if(!c||!Number.isFinite(Number(c.lng))||!Number.isFinite(Number(c.lat)))return false;const existing=window.EARTHLINE_PROPERTY_TARGET_16201;
  if(existing&&existing.source==='country-center'&&window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845&&window.EARTHLINE_COUNTRY_TARGET_LOCK_16845!==false)return true;const lng=Number(c.lng),lat=Number(c.lat),same=!!(existing&&!existing.code&&Math.abs(Number(existing.lng)-lng)<1e-7&&Math.abs(Number(existing.lat)-lat)<1e-7);if(same)return true;return setPropertyTarget16201({lng,lat,source:existing&&existing.code?'crosshair-corridor-zoom-17140':'crosshair'},{openPanel:false})}"""
if s.count(old_sync)!=1:
    raise SystemExit(f"Expected one property map sync owner, found {s.count(old_sync)}")
s=s.replace(old_sync,new_sync,1)

# 3) Corridor interaction: preserve click-to-open, but never steal a drag from Mapbox.
old_corr="""    document.addEventListener('pointerdown',e=>{
      const t=corridorEventTarget16152(e);if(!t)return;
      corridorPointer16152={...t,pointerId:e.pointerId,x:e.clientX,y:e.clientY,at:performance.now()};
      t.el.classList.add('el52-pressed');stopCorridorEvent16152(e);
    },{capture:true,passive:false});
    document.addEventListener('pointerup',e=>{
      const p=corridorPointer16152;if(!p||p.pointerId!==e.pointerId)return;
      const moved=Math.hypot(e.clientX-p.x,e.clientY-p.y),elapsed=performance.now()-p.at;
      stopCorridorEvent16152(e);clearCorridorPress16152();
      if(moved<=18&&elapsed<=1600)openCorridor16152(p,'pointer');
    },{capture:true,passive:false});
    document.addEventListener('pointercancel',e=>{if(corridorPointer16152&&corridorPointer16152.pointerId===e.pointerId){stopCorridorEvent16152(e);clearCorridorPress16152();}},{capture:true,passive:false});
    document.addEventListener('click',e=>{
      const t=corridorEventTarget16152(e);if(!t)return;
      stopCorridorEvent16152(e);
      if(performance.now()-lastCorridorOpen16152>350)openCorridor16152(t,'click-fallback');
    },true);"""
new_corr="""    let corridorSuppressClickUntil16152=0;
    document.addEventListener('pointerdown',e=>{
      const t=corridorEventTarget16152(e);if(!t)return;
      corridorPointer16152={...t,pointerId:e.pointerId,x:e.clientX,y:e.clientY,at:performance.now()};
      t.el.classList.add('el52-pressed');
    },{capture:true,passive:true});
    document.addEventListener('pointerup',e=>{
      const p=corridorPointer16152;if(!p||p.pointerId!==e.pointerId)return;
      const moved=Math.hypot(e.clientX-p.x,e.clientY-p.y),elapsed=performance.now()-p.at;
      clearCorridorPress16152();
      if(moved<=18&&elapsed<=1600){stopCorridorEvent16152(e);openCorridor16152(p,'pointer');}
      else corridorSuppressClickUntil16152=performance.now()+500;
    },{capture:true,passive:false});
    document.addEventListener('pointercancel',e=>{if(corridorPointer16152&&corridorPointer16152.pointerId===e.pointerId)clearCorridorPress16152();},{capture:true,passive:true});
    document.addEventListener('click',e=>{
      const t=corridorEventTarget16152(e);if(!t)return;
      stopCorridorEvent16152(e);
      if(performance.now()<corridorSuppressClickUntil16152)return;
      if(performance.now()-lastCorridorOpen16152>350)openCorridor16152(t,'click-fallback');
    },true);"""
if s.count(old_corr)!=1:
    raise SystemExit(f"Expected one corridor interaction block, found {s.count(old_corr)}")
s=s.replace(old_corr,new_corr,1)

p.write_text(s,encoding="utf-8")

q=p.read_text(encoding="utf-8")
assert "window.earthlinePositionSearchMenu16201=positionMenu16201" in q
assert "return window.earthlinePositionSearchMenu16201()" in q
assert "if(existing&&existing.code)return true" not in q[q.find("function syncPropertyTargetFromMap16201"):q.find("function syncPropertyTargetFromMap16201")+1200]
assert "corridorSuppressClickUntil16152" in q
assert "t.el.classList.add('el52-pressed');stopCorridorEvent16152(e);" not in q
print("V1 freeze search contract PASS")
