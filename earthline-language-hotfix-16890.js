(function(){
'use strict';
const KEY='earthlineLanguage16488';
function disableLanguage(){
  try{localStorage.setItem(KEY,'en')}catch(_){}
  window.EARTHLINE_LANGUAGE_16488='en';
  document.documentElement.lang='en';
  document.documentElement.dataset.earthlineLanguageDisabled='1';
  const sel=document.getElementById('earthlineLanguage16488');
  if(sel){
    try{sel.value='en'}catch(_){}
    sel.disabled=true;
    sel.setAttribute('disabled','');
    sel.setAttribute('aria-disabled','true');
    sel.setAttribute('title','Language options coming soon');
    sel.style.pointerEvents='none';
    sel.style.opacity='0.62';
  }
}
function blockLanguage(ev){
  const t=ev&&ev.target;
  if(t&&t.id==='earthlineLanguage16488'){
    ev.preventDefault();
    ev.stopImmediatePropagation();
    disableLanguage();
  }
}
window.earthlineApplyUiLanguage16871=function(){disableLanguage();return'en'};
window.earthlineApplyLanguage16890=function(){disableLanguage();return'en'};
window.earthlineLanguageOwner16890=Object.freeze({build:'EARTHLINE 16904',rule:'language control visible but inactive for launch; English only'});
for(const ev of ['click','pointerdown','mousedown','keydown','input','change'])document.addEventListener(ev,blockLanguage,true);
function boot(){
  disableLanguage();
  const root=document.documentElement||document.body;
  if(root&&typeof MutationObserver==='function'){
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      queueMicrotask(()=>{queued=false;disableLanguage()});
    });
    observer.observe(root,{subtree:true,childList:true});
  }
  setTimeout(disableLanguage,0);
  setTimeout(disableLanguage,250);
  setTimeout(disableLanguage,1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
