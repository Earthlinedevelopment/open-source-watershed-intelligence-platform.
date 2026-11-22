/* EARTHLINE WATER-PATH HOLD (Nov 21, 2026) — decision A: hide the current water-path lines until the replacement
   water-path module is verified. One owner, one file, removable in one step (delete this file and its script tag).
   Hides: the Property water-path SVG sheets and every Earthline map layer that draws flow lines/arrows.
   Does not touch swales, recharge targets, aquifer evidence, Elder trees, contours or any computation. */
(function(){
  'use strict';
  const LAYER=/^(earthline|el)-(?:live-)?(?:regional-|property-)?(?:modeled-)?flow/i;
  const css=document.createElement('style');css.id='earthline-waterpath-hold';
  css.textContent='#earthlinePropertyWaterOverlay15824,#earthlineInterceptionOverlay15825{display:none!important}';
  (document.head||document.documentElement).appendChild(css);
  let hidden=0;
  function apply(m){
    try{const st=m.getStyle&&m.getStyle();if(!st||!st.layers)return;
      for(const l of st.layers){if(LAYER.test(l.id)&&!/image/i.test(l.id)){
        try{if(m.getLayoutProperty(l.id,'visibility')!=='none'){m.setLayoutProperty(l.id,'visibility','none');hidden++;}}catch(_){}}}
      window.EARTHLINE_WATERPATH_HOLD={active:true,layersHiddenSoFar:hidden,at:new Date().toISOString()};
    }catch(_){}
  }
  function attach(){
    const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
    if(!m||typeof m.on!=='function')return false;
    apply(m);m.on('styledata',()=>apply(m));m.on('sourcedata',()=>apply(m));m.on('idle',()=>apply(m));return true;
  }
  if(!attach()){let n=0;const t=setInterval(()=>{if(attach()||++n>240)clearInterval(t);},250);}
})();
