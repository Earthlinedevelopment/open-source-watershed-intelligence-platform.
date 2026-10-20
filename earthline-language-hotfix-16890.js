(function(){
'use strict';
const KEY='earthlineLanguage16488';
const OPTIONS=[
  {value:'en',label:'Eng'},
  {value:'th',label:'Thai'},
  {value:'vi',label:'Vietnamese'},
  {value:'lo',label:'Laotian'}
];
function ensureLanguageOptions(){
  const sel=document.getElementById('earthlineLanguage16488');
  if(!sel)return;
  const current=Array.from(sel.options||[]).map(o=>({value:String(o.value||''),label:String(o.textContent||'')}));
  const same=current.length===OPTIONS.length&&current.every((o,i)=>o.value===OPTIONS[i].value&&o.label===OPTIONS[i].label);
  if(!same){
    sel.replaceChildren();
    for(const item of OPTIONS){
      const opt=document.createElement('option');
      opt.value=item.value;
      opt.textContent=item.label;
      sel.appendChild(opt);
    }
  }
  let saved='en';
  try{saved=localStorage.getItem(KEY)||'en'}catch(_){}
  if(!OPTIONS.some(o=>o.value===saved)){
    saved='en';
    try{localStorage.setItem(KEY,'en')}catch(_){}
  }
  try{sel.value=saved}catch(_){}
  sel.dataset.earthlineLanguageControl='1';
  if(sel.dataset.earthlineLanguageBound16890!=='1'){
    sel.dataset.earthlineLanguageBound16890='1';
    sel.addEventListener('change',()=>{
      const next=OPTIONS.some(o=>o.value===sel.value)?sel.value:'en';
      try{localStorage.setItem(KEY,next)}catch(_){}
      document.documentElement.lang=next;
      window.EARTHLINE_LANGUAGE_16488=next;
    });
  }
  document.documentElement.lang=saved;
  window.EARTHLINE_LANGUAGE_16488=saved;
  sel.disabled=false;
  sel.removeAttribute('disabled');
  sel.setAttribute('aria-disabled','false');
  sel.setAttribute('title','Language');
  sel.style.pointerEvents='auto';
  sel.style.opacity='1';
}
function boot(){
  ensureLanguageOptions();
  const root=document.documentElement||document.body;
  if(root&&typeof MutationObserver==='function'){
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      queueMicrotask(()=>{queued=false;ensureLanguageOptions()});
    });
    observer.observe(root,{subtree:true,childList:true});
  }
  setTimeout(ensureLanguageOptions,0);
  setTimeout(ensureLanguageOptions,250);
  setTimeout(ensureLanguageOptions,1000);
}
window.earthlineLanguageOwner16890=Object.freeze({build:'EARTHLINE 16908',rule:'language pulldown options visible: Eng, Thai, Vietnamese, Laotian'});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
