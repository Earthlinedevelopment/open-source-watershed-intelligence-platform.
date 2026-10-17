from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_down="""b.onpointerdown=function(e){
    e.stopPropagation();
    if(e.isPrimary===false||(e.pointerType==='mouse'&&Number(e.button)!==0))return;
    b.dataset.earthlinePropertyPointerArmed17441=String(e.pointerId??1);
  };"""
new_down="""b.onpointerdown=function(e){
    e.stopPropagation();
    if(e.isPrimary===false||(e.pointerType==='mouse'&&Number(e.button)!==0))return;
    b.dataset.earthlinePropertyPointerArmed17441=String(e.pointerId??1);
    try{if(Number.isFinite(Number(e.pointerId)))b.setPointerCapture(e.pointerId)}catch(_){}
  };"""
if s.count(old_down)!=1: raise SystemExit(f"pointerdown owner anchor count {s.count(old_down)}")
s=s.replace(old_down,new_down,1)

old_cancel="""  b.onpointercancel=function(){delete b.dataset.earthlinePropertyPointerArmed17441};"""
new_cancel="""  b.onpointercancel=function(e){
    delete b.dataset.earthlinePropertyPointerArmed17441;
    try{if(Number.isFinite(Number(e?.pointerId))&&b.hasPointerCapture?.(e.pointerId))b.releasePointerCapture(e.pointerId)}catch(_){}
  };"""
if s.count(old_cancel)!=1: raise SystemExit(f"pointercancel owner anchor count {s.count(old_cancel)}")
s=s.replace(old_cancel,new_cancel,1)

old_up="""  b.onpointerup=function(e){
    const armed=String(b.dataset.earthlinePropertyPointerArmed17441||'');
    delete b.dataset.earthlinePropertyPointerArmed17441;
    if(e.isPrimary===false||(e.pointerType==='mouse'&&Number(e.button)!==0))return;
    if(armed&&armed!==String(e.pointerId??1))return;
    b.dataset.earthlinePropertyPointerLaunched17441=String(Date.now());
    void declareProperty(e);
  };"""
new_up="""  b.onpointerup=function(e){
    const armed=String(b.dataset.earthlinePropertyPointerArmed17441||'');
    delete b.dataset.earthlinePropertyPointerArmed17441;
    try{if(Number.isFinite(Number(e.pointerId))&&b.hasPointerCapture?.(e.pointerId))b.releasePointerCapture(e.pointerId)}catch(_){}
    if(e.isPrimary===false||(e.pointerType==='mouse'&&Number(e.button)!==0))return;
    if(armed&&armed!==String(e.pointerId??1))return;
    b.dataset.earthlinePropertyPointerLaunched17441=String(Date.now());
    void declareProperty(e);
  };"""
if s.count(old_up)!=1: raise SystemExit(f"pointerup owner anchor count {s.count(old_up)}")
s=s.replace(old_up,new_up,1)

s="<!-- EARTHLINE_PROPERTY_POINTER_CAPTURE_17443: physical press retains button ownership through release despite map/panel motion. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched Property pointer capture 17443")
