(function(){
'use strict';
/* EARTHLINE 17073 — remove the public language control with one static CSS rule.
   No MutationObserver, polling, timers, layout owner, hydrology, map, search,
   swale, recharge, report, or translation-engine changes. */
const STYLE_ID='earthlineLanguageHidden17073';
if(!document.getElementById(STYLE_ID)){
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent='#earthlineLanguageWrap16488,#earthlineLanguage16488{display:none!important;visibility:hidden!important;pointer-events:none!important}';
  (document.head||document.documentElement).appendChild(style);
}
window.earthlineLanguageOwner16890=Object.freeze({
  build:'EARTHLINE 17073',
  rule:'public language wrapper and selector hidden by static CSS only; translation code preserved'
});
})();
