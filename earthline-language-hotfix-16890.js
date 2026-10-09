(function(){
'use strict';
/* EARTHLINE 17071 — temporarily retire the public language control.
   Presentation-only. Preserve existing language/translation code for later restoration.
   No hydrology, Mapbox, search, swale, report, recharge, or account behavior changes. */
function hideLanguageControl(){
  const sel=document.getElementById('earthlineLanguage16488');
  if(!sel)return false;
  try{
    sel.hidden=true;
    sel.setAttribute('aria-hidden','true');
    sel.setAttribute('tabindex','-1');
    sel.style.setProperty('display','none','important');
    sel.style.setProperty('visibility','hidden','important');
    sel.style.setProperty('pointer-events','none','important');
  }catch(_){}
  return true;
}
function boot(){
  hideLanguageControl();
  const root=document.documentElement||document.body;
  if(root&&typeof MutationObserver==='function'){
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      queueMicrotask(()=>{queued=false;hideLanguageControl()});
    });
    observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class','hidden']});
  }
  for(const ms of [0,80,250,700,1400])setTimeout(hideLanguageControl,ms);
}
window.earthlineLanguageOwner16890=Object.freeze({
  build:'EARTHLINE 17071',
  rule:'public language control temporarily hidden; translation code preserved'
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
