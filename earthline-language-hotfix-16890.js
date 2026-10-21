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
  if(!sel)return false;
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
  if(!OPTIONS.some(o=>o.value===saved))saved='en';
  try{sel.value=saved}catch(_){}
  sel.dataset.earthlineLanguageControl='1';
  sel.disabled=false;
  sel.removeAttribute('disabled');
  sel.setAttribute('aria-disabled','false');
  sel.setAttribute('title','Language');
  sel.style.pointerEvents='auto';
  sel.style.opacity='1';
  return true;
}
function boot(){ensureLanguageOptions()}
window.earthlineLanguageOwner16890=Object.freeze({
  build:'EARTHLINE 17620',
  rule:'presentation-only language option list; language state and translation are owned by earthline-launch-16872'
});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();