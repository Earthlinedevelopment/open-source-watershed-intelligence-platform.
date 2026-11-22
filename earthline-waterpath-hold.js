/* EARTHLINE WATER-PATH HOLD — approved choice A. Presentation only.
   Unverified modeled D8 water lines remain hidden until a verified water engine replaces them.
   Does not modify terrain, aquifer, recharge, bioswales, or authoritative mapped hydrography. */
(function(){
  'use strict';
  const IDS=['earthlinePropertyWaterOverlay15824','earthlineInterceptionOverlay15825'];
  const LAYER=/^(earthline|el)-(?:live-)?(?:regional-|property-)?(?:modeled-)?flow/i;
  const css=document.createElement('style');
  css.id='earthline-waterpath-hold';
  css.textContent=IDS.map(id=>'#'+id+'{display:none!important}').join('');
  (document.head||document.documentElement).appendChild(css);
  const watched=new WeakSet();
  const attrObserver=new MutationObserver(()=>suppressSvg());
  let layersHidden=0;
  function suppressSvg(){
    for(const id of IDS){
      const el=document.getElementById(id);
      if(!el)continue;
      if(!watched.has(el)){
        watched.add(el);
        attrObserver.observe(el,{attributes:true,attributeFilter:['style']});
      }
      /* The old D8 renderer sets display:block!important inline, which wins over
         stylesheet !important. An inline-important hold is required. */
      if(el.style.getPropertyValue('display')!=='none'||el.style.getPropertyPriority('display')!=='important'){
        el.style.setProperty('display','none','important');
      }
    }
  }
  function hideMapFlow(m){
    try{
      const st=m.getStyle&&m.getStyle();
      if(!st||!Array.isArray(st.layers))return;
      for(const l of st.layers){
        if(!LAYER.test(l.id)||/image/i.test(l.id))continue;
        try{
          if(m.getLayoutProperty(l.id,'visibility')!=='none'){
            m.setLayoutProperty(l.id,'visibility','none');
            layersHidden++;
          }
        }catch(_){}
      }
    }catch(_){}
  }
  function apply(m){
    suppressSvg();
    hideMapFlow(m);
    window.EARTHLINE_WATERPATH_HOLD={active:true,layersHiddenSoFar:layersHidden,at:new Date().toISOString()};
  }
  function attach(){
    const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
    if(!m||typeof m.on!=='function')return false;
    apply(m);
    for(const event of ['styledata','sourcedata','idle'])m.on(event,()=>apply(m));
    return true;
  }
  function init(){
    suppressSvg();
    const host=document.querySelector('.map-area');
    if(host){
      const childObserver=new MutationObserver(()=>suppressSvg());
      childObserver.observe(host,{childList:true,subtree:true});
    }
    if(!attach()){
      let tries=0;
      const timer=setInterval(()=>{
        suppressSvg();
        if(attach()||++tries>240)clearInterval(timer);
      },250);
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
