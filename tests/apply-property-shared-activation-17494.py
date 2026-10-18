from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

# Canonical control creator must never overwrite the shared Property activation
# with raw declareProperty during the same physical press.
old="""}/* EARTHLINE 16546 — the existing single Property control always owns exactly one current click handler, even if another panel owner created or moved the button before this installer runs. Assignment replaces any stale onclick owner rather than stacking a listener. */b.onclick=declareProperty;b.dataset.earthlinePropertyClickOwner16546='current';return b}"""
new="""}/* EARTHLINE 17494 — canonical Property control delegates to the one shared
activation owner. This prevents ensureDeclareButton() from replacing onclick
with raw declareProperty between pointerup and click. */
b.onclick=function(ev){
  const activate=window.earthlineActivateProperty17494;
  return typeof activate==='function'?activate(ev,b,'click'):declareProperty(ev);
};
b.dataset.earthlinePropertyClickOwner16546='shared-17494';return b}"""
if s.count(old)!=1: raise SystemExit(f"ensureDeclareButton anchor {s.count(old)}")
s=s.replace(old,new,1)

# Replace the 17492 per-element launcher in reconcilePanel with one global
# activation function used by both canonical button owners.
start=s.index("  property.__earthlineLaunch17492=function(ev){",s.index("function reconcilePanel16188"))
end=s.index("  };property.querySelector('.el69-dot')?.remove();",start)+4
oldblock=s[start:end]
newblock=r'''  window.earthlineActivateProperty17494=function(ev,b,source){
    b=b||document.getElementById('earthlineDeclareProperty16169');
    if(!b)return false;
    const now=Date.now(),last=Number(b.dataset.earthlinePointerLaunch17444||0);
    const pointerSource=source==='pointerup';
    if(pointerSource){
      if(ev&&Number.isFinite(Number(ev.button))&&Number(ev.button)!==0)return false;
      if(now-last<900)return false;
      b.dataset.earthlinePointerLaunch17444=String(now);
    }else if(ev&&Number(ev.detail||0)!==0&&now-last<1200){
      ev.preventDefault?.();ev.stopPropagation?.();return false;
    }else if(!pointerSource){
      b.dataset.earthlinePointerLaunch17444=String(now);
    }
    const fn=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof fn!=='function')return false;
    const serialBefore17494=Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0);
    b.dataset.earthlinePressAccepted17494='1';
    document.documentElement.classList.add('earthline-property-orb-latched-16244');

    /* I/O-only warm at the exact current target; no presentation/state mutation. */
    try{void window.EARTHLINE_ELDER_TREES_V1_17097?.prefetchPropertyTarget?.()}catch(_){}

    const launch17494=()=>{
      try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}
      let out17494;
      try{out17494=fn()}catch(_){
        if(Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17494){
          b.dataset.earthlinePressAccepted17494='';
          document.documentElement.classList.remove('earthline-property-orb-latched-16244');
        }
        return;
      }
      Promise.resolve(out17494).then(v17494=>{
        if(v17494===false&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17494){
          b.dataset.earthlinePressAccepted17494='';
          document.documentElement.classList.remove('earthline-property-orb-latched-16244');
        }
      }).catch(()=>{
        if(Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17494){
          b.dataset.earthlinePressAccepted17494='';
          document.documentElement.classList.remove('earthline-property-orb-latched-16244');
        }
      });
    };
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>setTimeout(launch17494,0));
    else setTimeout(launch17494,0);
    return false;
  };
  property.onpointerup=function(ev){
    return window.earthlineActivateProperty17494(ev,property,'pointerup');
  };
  property.onclick=function(ev){
    return window.earthlineActivateProperty17494(ev,property,'click');
  };
  property.dataset.earthlinePropertyClickOwner16546='shared-17494';'''
s=s[:start]+newblock+s[end:]

s="<!-- EARTHLINE_PROPERTY_SHARED_ACTIVATION_17494: ensureDeclareButton + reconcilePanel share one activation owner. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed shared Property activation owner 17494")
