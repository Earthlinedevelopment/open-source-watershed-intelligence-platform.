from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_decl="""  async function declareProperty(e){
    e?.preventDefault?.();e?.stopPropagation?.();e?.stopImmediatePropagation?.();
    const governed=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof governed!=='function'){
      try{if(typeof earthlineReady==='function')earthlineReady('PROPERTY ANALYSIS BLOCKED — governed property controller is unavailable.')}catch(_){}
      return false;
    }
    const target=window.EARTHLINE_PROPERTY_TARGET_16201;
    const hasTarget=!!(target&&Number.isFinite(Number(target.lng))&&Number.isFinite(Number(target.lat)));
    if(hasTarget){
      /* EARTHLINE 16254 — direct Property handoff. Do not launch a 3 km Focus
         analysis first and do not move the camera here. The preserved terminal
         Property owner below declares the 20-acre Property state before it moves
         the camera, then runs the authoritative terrain/exclusion/swale pipeline. */
      window.EARTHLINE_PROPERTY_TARGET_16201=Object.assign({},target,{at:new Date().toISOString(),source:target.code?'corridor-direct-property-16254':String(target.source||'crosshair')});
    }
    return await Promise.resolve(governed(e));
  }
"""
new_decl="""  async function declareProperty(e){
    e?.preventDefault?.();e?.stopPropagation?.();e?.stopImmediatePropagation?.();
    const governed=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof governed!=='function'){
      try{if(typeof earthlineReady==='function')earthlineReady('PROPERTY ANALYSIS BLOCKED — governed property controller is unavailable.')}catch(_){}
      return false;
    }
    const target=window.EARTHLINE_PROPERTY_TARGET_16201;
    const hasTarget=!!(target&&Number.isFinite(Number(target.lng))&&Number.isFinite(Number(target.lat)));
    if(hasTarget){
      /* EARTHLINE 16254 — direct Property handoff. Do not launch a 3 km Focus
         analysis first and do not move the camera here. The preserved terminal
         Property owner below declares the 20-acre Property state before it moves
         the camera, then runs the authoritative terrain/exclusion/swale pipeline. */
      window.EARTHLINE_PROPERTY_TARGET_16201=Object.assign({},target,{at:new Date().toISOString(),source:target.code?'corridor-direct-property-16254':String(target.source||'crosshair')});
    }
    return await Promise.resolve(governed(e));
  }
  /* EARTHLINE 17423 — one authoritative DOM Property click owner.
     The panel may move/reconcile this button, but it must not replace this wrapper. */
  window.earthlinePropertyClickOwner17423=declareProperty;
"""
if s.count(old_decl)!=1:
    raise SystemExit(f"declareProperty anchor count {s.count(old_decl)}")
s=s.replace(old_decl,new_decl,1)

old_ensure="""b.onclick=declareProperty;b.dataset.earthlinePropertyClickOwner16546='current';return b}"""
new_ensure="""b.onclick=declareProperty;b.dataset.earthlinePropertyClickOwner16546='authoritative-wrapper-17423';return b}"""
if s.count(old_ensure)!=1:
    raise SystemExit(f"ensure button owner anchor count {s.count(old_ensure)}")
s=s.replace(old_ensure,new_ensure,1)

old_panel="""if(property){property.onclick=function(ev){const fn=window.earthlineDeclarePropertyAtCrosshair16173;return typeof fn==='function'?fn(ev):false};property.querySelector('.el69-dot')?.remove();"""
new_panel="""if(property){const propertyOwner17423=window.earthlinePropertyClickOwner17423;if(typeof propertyOwner17423==='function'&&property.onclick!==propertyOwner17423)property.onclick=propertyOwner17423;property.dataset.earthlinePropertyClickOwner16546='authoritative-wrapper-17423';property.querySelector('.el69-dot')?.remove();"""
if s.count(old_panel)!=1:
    raise SystemExit(f"panel overwrite anchor count {s.count(old_panel)}")
s=s.replace(old_panel,new_panel,1)

s="<!-- EARTHLINE_PROPERTY_SINGLE_CLICK_OWNER_17423: panel reconciliation preserves the single authoritative Property wrapper onclick. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed single authoritative Property click owner 17423")
