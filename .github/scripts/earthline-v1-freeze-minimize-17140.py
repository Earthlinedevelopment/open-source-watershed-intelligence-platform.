from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

# Restore accepted 17064 corridor interaction exactly. It was not needed for the
# search repair and does not belong in the V1 freeze delta.
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
if s.count(new_corr)!=1:
    raise SystemExit(f"Expected one experimental corridor block, found {s.count(new_corr)}")
s=s.replace(new_corr,old_corr,1)

# Stability-only JSONP cleanup: a timed-out remote script can still execute after
# its callback was deleted. Leave a no-op sentinel so that late execution cannot
# raise an uncaught ReferenceError. No source, geometry or verdict behavior changes.
old_cleanup="""function cleanup(){try{script.remove()}catch(_){}try{delete window[cb]}catch(_){window[cb]=undefined}}"""
new_cleanup="""function cleanup(){try{script.remove()}catch(_){}try{window[cb]=()=>{};setTimeout(()=>{try{delete window[cb]}catch(_){window[cb]=undefined}},60000)}catch(_){window[cb]=()=>{}}}"""
if s.count(old_cleanup)!=1:
    raise SystemExit(f"Expected one Vermont JSONP cleanup owner, found {s.count(old_cleanup)}")
s=s.replace(old_cleanup,new_cleanup,1)

p.write_text(s,encoding="utf-8")
q=p.read_text(encoding="utf-8")
assert old_corr in q
assert "corridorSuppressClickUntil16152" not in q
assert new_cleanup in q
assert "window.earthlinePositionSearchMenu16201=positionMenu16201" in q
assert "crosshair-corridor-zoom-17140" in q
print("V1 freeze minimized PASS")
