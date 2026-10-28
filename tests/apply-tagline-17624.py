from pathlib import Path
p=Path("earthline-launch-16872.js")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE_LOCKED_TAGLINE_17624"
if marker in s:
    raise SystemExit(0)
append=r'''

/* EARTHLINE_LOCKED_TAGLINE_17624
   Presentation ownership only. Restores the user-locked Earthline phrase in the
   active interface above Search without changing logo, Search Orb, or science. */
(function installEarthlineLockedTagline17624(){
  if(window.EARTHLINE_LOCKED_TAGLINE_17624)return;
  function ensure(){
    const brand=document.getElementById('earthlinePanelBrand16201');
    const search=document.getElementById('searchInput');
    if(!brand||!search)return false;
    let el=document.getElementById('earthlineLockedTagline17624');
    if(!el){
      el=document.createElement('div');
      el.id='earthlineLockedTagline17624';
      el.setAttribute('aria-label','Slow it. Sink it. Spread it.');
      el.innerHTML='<span>Slow it.</span> <span class="earthline-tagline-sink-17624">Sink it.</span> <span>Spread it.</span>';
      const logo=brand.querySelector('.brand');
      if(logo&&logo.nextSibling)brand.insertBefore(el,logo.nextSibling);
      else brand.insertBefore(el,brand.firstChild);
    }
    el.style.cssText='display:block!important;visibility:visible!important;opacity:1!important;margin:2px 0 9px!important;text-align:center!important;color:#e7eef7!important;font:800 16px/1.2 "Noto Sans","Segoe UI",Arial,sans-serif!important;letter-spacing:.01em!important;white-space:nowrap!important';
    const sink=el.querySelector('.earthline-tagline-sink-17624');
    if(sink)sink.style.cssText='color:#4ec9ff!important';
    return true;
  }
  function boot(){
    ensure();
    for(const ms of [0,80,260,700,1500])setTimeout(ensure,ms);
    const root=document.documentElement||document.body;
    if(root&&typeof MutationObserver==='function'){
      let queued=false;
      const observer=new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;ensure()})});
      observer.observe(root,{subtree:true,childList:true});
    }
  }
  window.EARTHLINE_LOCKED_TAGLINE_17624=Object.freeze({text:'Slow it. Sink it. Spread it.',position:'active brand area above Search'});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
'''
p.write_text(s+append,encoding="utf-8")
print("locked tagline 17624 installed")
