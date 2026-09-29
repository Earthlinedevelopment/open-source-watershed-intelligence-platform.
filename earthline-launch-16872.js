(function(){
'use strict';
const LANG_KEY='earthline-language-choice-16880';
function norm(v){return String(v||'').replace(/\s+/g,' ').trim().toLowerCase()}
function detect(v){const s=norm(v);if(!s)return'';if(/(^|\b)(en|eng|english)(\b|$)/.test(s))return'en';if(/(^|\b)(es|esp|español|espanol|spanish)(\b|$)/.test(s))return'es';if(/(^|\b)(vi|vie|việt|viet|vietnamese)(\b|$)/.test(s))return'vi';if(/(^|\b)(th|tha|ไทย|thai)(\b|$)/.test(s))return'th';return''}
function fromSelect(s){if(!s)return'';const o=s.selectedOptions&&s.selectedOptions[0];return detect([s.value,o&&o.value,o&&o.textContent].filter(Boolean).join(' '))}
function stored(){try{return sessionStorage.getItem(LANG_KEY)||''}catch(_){return''}}
function remember(code){try{sessionStorage.setItem(LANG_KEY,code)}catch(_){}}
function setLang(code,allowEnglishReset){if(!code)return;const prev=stored();remember(code);document.documentElement.lang=code;if(code==='en'&&allowEnglishReset&&prev&&prev!=='en'){setTimeout(()=>location.reload(),0)}}
function seed(){for(const s of document.querySelectorAll('select')){const c=fromSelect(s);if(c){setLang(c,true);return}}setLang(detect(document.documentElement.lang)||'en',false)}
function sync(e){const t=e&&e.target;if(!t)return;const s=t.matches&&t.matches('select')?t:(t.closest&&t.closest('select'));const c=s?fromSelect(s):detect([t.value,t.textContent,t.getAttribute&&t.getAttribute('data-lang'),t.getAttribute&&t.getAttribute('data-language')].filter(Boolean).join(' '));if(c)setLang(c,true)}
document.addEventListener('change',sync,true);
document.addEventListener('click',e=>{const t=e&&e.target;if(t&&t.matches&&t.matches('select'))return;sync(e)},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',seed,{once:true});else seed();
const s=document.createElement('script');s.src='earthline-launch-wrapper-16878.js?v=16880';s.async=false;(document.head||document.documentElement).appendChild(s);
})();
