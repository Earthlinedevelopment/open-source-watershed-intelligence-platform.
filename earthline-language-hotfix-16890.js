(function(){
'use strict';
const KEY='earthlineLanguage16488';
const OPTIONS=[['en','Eng'],['th','ไทย'],['vi','Tiếng Việt'],['lo','ລາວ']];
function normalizeLanguageOptions(sel){
  if(!sel)return;
  const signature=OPTIONS.map(([v,t])=>v+':'+t).join('|');
  if(sel.dataset.earthlineLaunchOptions16906===signature)return;
  sel.replaceChildren(...OPTIONS.map(([value,text])=>{const o=document.createElement('option');o.value=value;o.textContent=text;return o;}));
  sel.dataset.earthlineLaunchOptions16906=signature;
}
function disableLanguage(){
  try{localStorage.setItem(KEY,'en')}catch(_){}
  window.EARTHLINE_LANGUAGE_16488='en';
  document.documentElement.lang='en';
  document.documentElement.dataset.earthlineLanguageDisabled='1';
  const sel=document.getElementById('earthlineLanguage16488');
  if(sel){
    normalizeLanguageOptions(sel);
    try{sel.value='en'}catch(_){}
    sel.disabled=true;
    sel.setAttribute('disabled','');
    sel.setAttribute('aria-disabled','true');
    sel.setAttribute('title','Language options coming soon');
    sel.style.pointerEvents='none';
    sel.style.opacity='0.62';
  }
}
function clearRegionalTransition16906(){
  try{
    window.EARTHLINE_REGIONAL_VISUAL_DATA_16020=null;
    document.getElementById('earthlineRegionalVectorOverlay16020')?.replaceChildren();
    document.getElementById('earthlineRegionalCorridorTabs16323')?.remove();
    const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null;
    const empty={type:'FeatureCollection',features:[]};
    for(const id of ['earthline-ranked-swale-opportunities-15775','earthline-regional-flow-15761','earthline-regional-grades-15772','earthline-regional-contours-15772','earthline-regional-coverage-15761','earthline-swales','earthline-recharge-zones']){
      const src=map&&map.getSource&&map.getSource(id);
      if(src&&typeof src.setData==='function')src.setData(empty);
    }
    window.EARTHLINE_REGIONAL_TRANSITION_CLEAR_AUDIT_16906={ok:true,at:new Date().toISOString()};
  }catch(error){
    window.EARTHLINE_REGIONAL_TRANSITION_CLEAR_AUDIT_16906={ok:false,error:String(error&&error.message||error),at:new Date().toISOString()};
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
function transitionGuard(ev){
  const t=ev&&ev.target;
  if(!t)return;
  const run=t.closest&&t.closest('#runBtn,.toprunbtn,#searchOrb');
  if(run)clearRegionalTransition16906();
}
window.earthlineApplyUiLanguage16871=function(){disableLanguage();return'en'};
window.earthlineApplyLanguage16890=function(){disableLanguage();return'en'};
window.earthlineLanguageOwner16890=Object.freeze({build:'EARTHLINE 16906',rule:'language control visible but inactive for launch; options Eng, Thai, Vietnamese, Laotian'});
for(const ev of ['click','pointerdown','mousedown','keydown','input','change'])document.addEventListener(ev,blockLanguage,true);
document.addEventListener('click',transitionGuard,true);
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
