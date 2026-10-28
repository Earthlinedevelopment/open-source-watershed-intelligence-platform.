from pathlib import Path
content=r"""(function(){
'use strict';
const KEY='earthlineLanguage16488';
const OPTIONS=[
  {value:'en',label:'Eng'},
  {value:'th',label:'Thai'},
  {value:'vi',label:'Vietnamese'},
  {value:'lo',label:'Laotian'}
];
function styleImportant(el,name,value){
  try{el.style.setProperty(name,value,'important')}catch(_){}
}
function ensureLanguageOptions(){
  const rail=document.getElementById('earthlineRail16188');
  if(!rail)return false;
  let wrap=document.getElementById('earthlineLanguageWrap16488');
  if(!wrap){
    wrap=document.createElement('div');
    wrap.id='earthlineLanguageWrap16488';
    wrap.setAttribute('aria-label','Language');
    const contact=document.getElementById('earthlineRailContact16512');
    if(contact&&contact.parentElement===rail)rail.insertBefore(wrap,contact);else rail.appendChild(wrap);
  }
  styleImportant(wrap,'display','flex');
  styleImportant(wrap,'visibility','visible');
  styleImportant(wrap,'opacity','1');
  styleImportant(wrap,'position','relative');
  styleImportant(wrap,'align-items','center');
  styleImportant(wrap,'justify-content','center');
  styleImportant(wrap,'width','100%');
  styleImportant(wrap,'min-height','42px');
  styleImportant(wrap,'padding','4px 2px');
  let sel=document.getElementById('earthlineLanguage16488');
  if(!sel){
    sel=document.createElement('select');
    sel.id='earthlineLanguage16488';
    sel.setAttribute('aria-label','Language');
    wrap.appendChild(sel);
  }else if(sel.parentElement!==wrap){
    wrap.appendChild(sel);
  }
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
  try{saved=localStorage.getItem(KEY)||document.documentElement.lang||'en'}catch(_){}
  saved=String(saved).toLowerCase().slice(0,2);
  if(!OPTIONS.some(o=>o.value===saved))saved='en';
  sel.value=saved;
  sel.disabled=false;
  sel.removeAttribute('disabled');
  sel.setAttribute('aria-disabled','false');
  sel.setAttribute('title','Language');
  styleImportant(sel,'display','block');
  styleImportant(sel,'visibility','visible');
  styleImportant(sel,'opacity','1');
  styleImportant(sel,'position','relative');
  styleImportant(sel,'pointer-events','auto');
  styleImportant(sel,'width','58px');
  styleImportant(sel,'max-width','64px');
  styleImportant(sel,'height','34px');
  styleImportant(sel,'min-height','34px');
  styleImportant(sel,'font','700 9px/1.1 "Noto Sans",system-ui,sans-serif');
  styleImportant(sel,'background','#10222b');
  styleImportant(sel,'color','#e7eef7');
  styleImportant(sel,'border','1px solid #456474');
  styleImportant(sel,'border-radius','7px');
  styleImportant(sel,'padding','3px 2px');
  if(!sel.dataset.earthlineLanguageOwner17616){
    sel.dataset.earthlineLanguageOwner17616='1';
    sel.addEventListener('change',()=>{
      const code=String(sel.value||'en').toLowerCase();
      try{localStorage.setItem(KEY,code)}catch(_){}
      document.documentElement.lang=code;
      try{window.EARTHLINE_LAUNCH_16872?.translateVisibleText?.()}catch(_){}
    });
  }
  return true;
}
function boot(){
  ensureLanguageOptions();
  const root=document.documentElement||document.body;
  if(root&&typeof MutationObserver==='function'){
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;queued=true;
      queueMicrotask(()=>{queued=false;ensureLanguageOptions()});
    });
    observer.observe(root,{subtree:true,childList:true});
  }
  for(const ms of [0,80,250,700,1500])setTimeout(ensureLanguageOptions,ms);
}
window.earthlineLanguageOwner16890=Object.freeze({build:'EARTHLINE 17616',rule:'language rail visible: Eng, Thai, Vietnamese, Laotian'});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
"""
Path("earthline-language-hotfix-16890.js").write_text(content,encoding="utf-8")
print("language rail 17616 installed")
