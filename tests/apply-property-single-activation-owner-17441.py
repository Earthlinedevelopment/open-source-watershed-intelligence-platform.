from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_pd="""b.addEventListener('pointerdown',e=>e.stopPropagation(),true);"""
new_pd="""/* EARTHLINE 17441 — pointer activation is owned below with the click owner. */"""
if s.count(old_pd)!=1: raise SystemExit(f"legacy pointerdown listener count {s.count(old_pd)}")
s=s.replace(old_pd,new_pd,1)

old_owner="""b.onclick=declareProperty;b.dataset.earthlinePropertyClickOwner16546='current';return b}"""
new_owner="""b.onpointerdown=function(e){
    e.stopPropagation();
    if(e.isPrimary===false||(e.pointerType==='mouse'&&Number(e.button)!==0))return;
    b.dataset.earthlinePropertyPointerArmed17441=String(e.pointerId??1);
  };
  b.onpointercancel=function(){delete b.dataset.earthlinePropertyPointerArmed17441};
  b.onpointerup=function(e){
    const armed=String(b.dataset.earthlinePropertyPointerArmed17441||'');
    delete b.dataset.earthlinePropertyPointerArmed17441;
    if(e.isPrimary===false||(e.pointerType==='mouse'&&Number(e.button)!==0))return;
    if(armed&&armed!==String(e.pointerId??1))return;
    b.dataset.earthlinePropertyPointerLaunched17441=String(Date.now());
    void declareProperty(e);
  };
  b.onclick=function(e){
    const last=Number(b.dataset.earthlinePropertyPointerLaunched17441||0);
    if(Number(e?.detail||0)>0&&Date.now()-last<1500)return false;
    return declareProperty(e);
  };
  b.dataset.earthlinePropertyClickOwner16546='current';return b}"""
if s.count(old_owner)!=1: raise SystemExit(f"button click owner count {s.count(old_owner)}")
s=s.replace(old_owner,new_owner,1)

old_panel="""if(property){property.onclick=function(ev){const fn=window.earthlineDeclarePropertyAtCrosshair16173;return typeof fn==='function'?fn(ev):false};property.querySelector('.el69-dot')?.remove();"""
new_panel="""if(property){if(property.dataset.earthlinePropertyClickOwner16546!=='current')property.onclick=function(ev){const fn=window.earthlineDeclarePropertyAtCrosshair16173;return typeof fn==='function'?fn(ev):false};property.querySelector('.el69-dot')?.remove();"""
if s.count(old_panel)!=1: raise SystemExit(f"panel competing click owner count {s.count(old_panel)}")
s=s.replace(old_panel,new_panel,1)

s="<!-- EARTHLINE_PROPERTY_SINGLE_ACTIVATION_OWNER_17441: physical pointerup + keyboard click share one Property button owner; panel no longer overwrites it. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched single cross-browser Property activation owner 17441")
