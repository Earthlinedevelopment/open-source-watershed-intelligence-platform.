(function(){
'use strict';
function norm(v){return String(v||'').replace(/\s+/g,' ').trim().toLowerCase()}
function detect(v){const s=norm(v);if(!s)return'';if(/(^|\b)(en|eng|english)(\b|$)/.test(s))return'en';if(/(^|\b)(es|esp|español|espanol|spanish)(\b|$)/.test(s))return'es';if(/(^|\b)(vi|vie|việt|viet|vietnamese)(\b|$)/.test(s))return'vi';if(/(^|\b)(th|tha|ไทย|thai)(\b|$)/.test(s))return'th';return''}
function fromSelect(s){if(!s)return'';const o=s.selectedOptions&&s.selectedOptions[0];return detect([s.value,o&&o.value,o&&o.textContent].filter(Boolean).join(' '))}
function setLang(code){if(code&&document.documentElement.lang!==code)document.documentElement.lang=code}
function seed(){for(const s of document.querySelectorAll('select')){const c=fromSelect(s);if(c){setLang(c);return}}}
function sync(e){const t=e&&e.target;if(!t)return;const s=t.matches&&t.matches('select')?t:(t.closest&&t.closest('select'));const c=s?fromSelect(s):detect([t.value,t.textContent,t.getAttribute&&t.getAttribute('data-lang'),t.getAttribute&&t.getAttribute('data-language')].filter(Boolean).join(' '));if(c)setLang(c)}
document.addEventListener('change',sync,true);
document.addEventListener('click',sync,true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',seed,{once:true});else seed();
const s=document.createElement('script');s.src='earthline-launch-wrapper-16878.js?v=16879';s.async=false;(document.head||document.documentElement).appendChild(s);
})();
