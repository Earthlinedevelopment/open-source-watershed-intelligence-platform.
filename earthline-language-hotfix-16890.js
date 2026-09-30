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
    sel.setAttribute('aria-disabled','true');
    sel.setAttribute('title','Language options coming soon');
    sel.style.pointerEvents='none';
    sel.style.opacity='0.62';
  }
}
window.earthlineApplyUiLanguage16871=function(){disableLanguage();return'en'};
window.earthlineApplyLanguage16890=function(){disableLanguage();return'en'};
window.earthlineLanguageOwner16890=Object.freeze({build:'EARTHLINE 16901',rule:'language control visible but inactive for launch; English only'});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',disableLanguage,{once:true});else disableLanguage();
})();
