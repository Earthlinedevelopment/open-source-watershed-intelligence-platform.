from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""if(property){property.onclick=function(ev){const fn=window.earthlineDeclarePropertyAtCrosshair16173;return typeof fn==='function'?fn(ev):false};property.querySelector('.el69-dot')?.remove();"""
new="""if(property){
  /* EARTHLINE 17444 — one physical press, one governed Property launch.
     WebKit can lose the synthesized click when this control is reconciled during
     map/UI work. Pointer-up is the primary physical activation; click remains the
     keyboard/fallback activation and is deduped against the pointer launch. */
  property.onpointerup=function(ev){
    if(ev&&Number.isFinite(Number(ev.button))&&Number(ev.button)!==0)return false;
    const now=Date.now(),last=Number(property.dataset.earthlinePointerLaunch17444||0);
    if(now-last<900)return false;
    property.dataset.earthlinePointerLaunch17444=String(now);
    const fn=window.earthlineDeclarePropertyAtCrosshair16173;
    return typeof fn==='function'?fn(ev):false;
  };
  property.onclick=function(ev){
    const now=Date.now(),last=Number(property.dataset.earthlinePointerLaunch17444||0);
    if(ev&&Number(ev.detail||0)!==0&&now-last<1200){
      ev.preventDefault?.();ev.stopPropagation?.();return false;
    }
    property.dataset.earthlinePointerLaunch17444=String(now);
    const fn=window.earthlineDeclarePropertyAtCrosshair16173;
    return typeof fn==='function'?fn(ev):false;
  };property.querySelector('.el69-dot')?.remove();"""
if s.count(old)!=1: raise SystemExit(f"Property panel click owner anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_PROPERTY_ONE_PRESS_OWNER_17444: pointer-up physical activation + click keyboard fallback, deduped. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed cross-browser one-press Property control owner 17444")
