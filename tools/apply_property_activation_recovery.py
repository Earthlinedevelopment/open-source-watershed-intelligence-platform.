from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_ensure="""  function ensureDeclareButton(){let b=document.getElementById('earthlineDeclareProperty16169');const created16546=!b;if(!b){b=document.createElement('button');b.id='earthlineDeclareProperty16169';b.type='button';b.innerHTML='<svg width="24" height="24" viewBox="0 0 100 100" aria-hidden="true"><g class="earthline-orb-spin-16240"><use href="#orb"></use></g></svg><span>PROPERTY ANALYSIS · 20 ACRES</span>';b.setAttribute('aria-label','Declare a twenty-acre project area centered on the map crosshair and run property analysis');b.addEventListener('pointerdown',e=>e.stopPropagation(),true);const prewarm16457=()=>{try{const t=window.EARTHLINE_PROPERTY_TARGET_16201;if(t&&Number.isFinite(Number(t.lat))&&Number.isFinite(Number(t.lng))){if(typeof earthlinePrewarmPropertyDem16297==='function')void earthlinePrewarmPropertyDem16297(Number(t.lat),Number(t.lng));if(typeof window.earthlinePrefetchVermontAuthority16263==='function'&&typeof earthlineRectangleAround==='function'){const boundary16466=earthlineRectangleAround(Number(t.lng),Number(t.lat),20);void window.earthlinePrefetchVermontAuthority16263(boundary16466,M.searchGen);}}}catch(_){}};b.addEventListener('pointerenter',prewarm16457,{passive:true});b.addEventListener('focus',prewarm16457,{passive:true});document.body.appendChild(b)}/* EARTHLINE 16546 — the existing single Property control always owns exactly one current click handler, even if another panel owner created or moved the button before this installer runs. Assignment replaces any stale onclick owner rather than stacking a listener. */b.onclick=declareProperty;b.dataset.earthlinePropertyClickOwner16546='current';return b}
"""
new_ensure="""  function ensureDeclareButton(){let b=document.getElementById('earthlineDeclareProperty16169');const created16546=!b;if(!b){b=document.createElement('button');b.id='earthlineDeclareProperty16169';b.type='button';b.innerHTML='<svg width="24" height="24" viewBox="0 0 100 100" aria-hidden="true"><g class="earthline-orb-spin-16240"><use href="#orb"></use></g></svg><span>PROPERTY ANALYSIS · 20 ACRES</span>';b.setAttribute('aria-label','Declare a twenty-acre project area centered on the map crosshair and run property analysis');b.addEventListener('pointerdown',e=>e.stopPropagation(),true);const prewarm16457=()=>{try{const t=window.EARTHLINE_PROPERTY_TARGET_16201;if(t&&Number.isFinite(Number(t.lat))&&Number.isFinite(Number(t.lng))){if(typeof earthlinePrewarmPropertyDem16297==='function')void earthlinePrewarmPropertyDem16297(Number(t.lat),Number(t.lng));if(typeof window.earthlinePrefetchVermontAuthority16263==='function'&&typeof earthlineRectangleAround==='function'){const boundary16466=earthlineRectangleAround(Number(t.lng),Number(t.lat),20);void window.earthlinePrefetchVermontAuthority16263(boundary16466,M.searchGen);}}}catch(_){}};b.addEventListener('pointerenter',prewarm16457,{passive:true});b.addEventListener('focus',prewarm16457,{passive:true});document.body.appendChild(b)}/* EARTHLINE 17494 — canonical Property control delegates to the one shared activation owner. */b.onclick=function(ev){const activate=window.earthlineActivateProperty17494;return typeof activate==='function'?activate(ev,b,'click'):declareProperty(ev);};b.dataset.earthlinePropertyClickOwner16546='shared-17494';return b}
"""

old_prop="""if(property){property.onclick=function(ev){const fn=window.earthlineDeclarePropertyAtCrosshair16173;return typeof fn==='function'?fn(ev):false};property.querySelector('.el69-dot')?.remove();ensureOrb16233('earthlineDeclareProperty16169');let span=property.querySelector('span:last-child');if(!span){span=document.createElement('span');property.appendChild(span)}span.dataset.crosshair16247=window.EARTHLINE_PROPERTY_TARGET_16201?.code?'0':'1';if(property.dataset.busy!=='1')span.innerHTML=propertyTargetMarkup16871(window.EARTHLINE_PROPERTY_TARGET_16201);const ready=!!(window.EARTHLINE_PROPERTY_TARGET_16201||window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147);document.documentElement.classList.toggle('earthline-property-ready-16188',ready);property.disabled=!ready&&property.dataset.busy!=='1';property.setAttribute('aria-disabled',property.disabled?'true':'false')}"""

new_prop="""if(property){
  window.earthlineActivateProperty17494=function(ev,b,source){
    b=b||document.getElementById('earthlineDeclareProperty16169');
    if(!b)return false;
    const now=Date.now(),last=Number(b.dataset.earthlinePointerLaunch17444||0);
    const pointerSource=source==='pointerdown';
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
    const targetAtPress=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const acceptedTarget=(targetAtPress&&Number.isFinite(Number(targetAtPress.lng))&&Number.isFinite(Number(targetAtPress.lat)))
      ?Object.freeze(Object.assign({},targetAtPress,{acceptedAt:new Date().toISOString()})):null;
    if(!acceptedTarget)return false;
    window.EARTHLINE_PROPERTY_ACCEPTED_TARGET_M7839=acceptedTarget;
    b.dataset.earthlinePressAccepted17494='1';
    document.documentElement.classList.add('earthline-property-orb-latched-16244');
    let out;
    try{out=fn(ev,acceptedTarget)}catch(_){
      b.dataset.earthlinePressAccepted17494='';
      document.documentElement.classList.remove('earthline-property-orb-latched-16244');
      return false;
    }
    Promise.resolve(out).then(v=>{
      if(v===false){
        b.dataset.earthlinePressAccepted17494='';
        document.documentElement.classList.remove('earthline-property-orb-latched-16244');
      }
    }).catch(()=>{
      b.dataset.earthlinePressAccepted17494='';
      document.documentElement.classList.remove('earthline-property-orb-latched-16244');
    });
    return false;
  };
  property.onpointerdown=function(ev){return window.earthlineActivateProperty17494(ev,property,'pointerdown');};
  property.onclick=function(ev){return window.earthlineActivateProperty17494(ev,property,'click');};
  property.dataset.earthlinePropertyClickOwner16546='shared-17494';property.querySelector('.el69-dot')?.remove();ensureOrb16233('earthlineDeclareProperty16169');let span=property.querySelector('span:last-child');if(!span){span=document.createElement('span');property.appendChild(span)}span.dataset.crosshair16247=window.EARTHLINE_PROPERTY_TARGET_16201?.code?'0':'1';if(property.dataset.busy!=='1')span.innerHTML=propertyTargetMarkup16871(window.EARTHLINE_PROPERTY_TARGET_16201);const ready=!!(window.EARTHLINE_PROPERTY_TARGET_16201||window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147);document.documentElement.classList.toggle('earthline-property-ready-16188',ready);property.disabled=!ready&&property.dataset.busy!=='1';property.setAttribute('aria-disabled',property.disabled?'true':'false')}"""

if s.count(old_ensure)!=1:
    raise SystemExit(f"ensure owner count={s.count(old_ensure)}")
if s.count(old_prop)!=1:
    raise SystemExit(f"reconcile owner count={s.count(old_prop)}")

s=s.replace(old_ensure,new_ensure,1).replace(old_prop,new_prop,1)

if s.count("earthlineActivateProperty17494=function")!=1:
    raise SystemExit("activation owner not singular")
if "earthlinePropertyClickOwner16546='shared-17494'" not in s:
    raise SystemExit("shared activation owner missing")

p.write_text(s,encoding="utf-8")
print("Property activation owner restored")
