from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="<!-- EARTHLINE_PROPERTY_REPEAT_ONE_PRESS_17451: settled repeat Property control rebind. -->"
if marker in s:
    print("17451 already installed")
    raise SystemExit(0)

anchor="</body>"
if anchor not in s:
    raise SystemExit("body anchor unavailable")

script=r'''
<!-- EARTHLINE_PROPERTY_REPEAT_ONE_PRESS_17451: settled repeat Property control rebind. -->
<script>
(function installEarthlinePropertyRepeatOnePress17451(){
  if(window.EARTHLINE_PROPERTY_REPEAT_ONE_PRESS_17451)return;
  function bind(){
    const b=document.getElementById('earthlineDeclareProperty16169');
    if(!b)return false;
    b.onpointerup=function(ev){
      if(ev&&Number.isFinite(Number(ev.button))&&Number(ev.button)!==0)return false;
      const now=Date.now(),last=Number(b.dataset.earthlinePointerLaunch17444||0);
      if(now-last<900)return false;
      b.dataset.earthlinePointerLaunch17444=String(now);
      const fn=window.earthlineDeclarePropertyAtCrosshair16173;
      return typeof fn==='function'?fn(ev):false;
    };
    b.onclick=function(ev){
      const now=Date.now(),last=Number(b.dataset.earthlinePointerLaunch17444||0);
      if(ev&&Number(ev.detail||0)!==0&&now-last<1200){
        ev.preventDefault?.();ev.stopPropagation?.();return false;
      }
      b.dataset.earthlinePointerLaunch17444=String(now);
      const fn=window.earthlineDeclarePropertyAtCrosshair16173;
      return typeof fn==='function'?fn(ev):false;
    };
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    if(a?.settled===true&&a?.result===true){
      b.disabled=false;
      b.removeAttribute('disabled');
      document.documentElement.dataset.earthlinePropertyRunState='idle';
    }
    b.dataset.earthlinePropertyClickOwner16546='current';
    return true;
  }
  document.addEventListener('earthline:analysis-complete',e=>{
    const tier=String(e?.detail?.tier||e?.detail?.mode||'').toLowerCase();
    if(!tier.includes('property'))return;
    setTimeout(bind,0);
    setTimeout(bind,120);
  },{passive:true});
  window.EARTHLINE_PROPERTY_REPEAT_ONE_PRESS_17451={state:'ready',bind};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>bind(),{once:true});else bind();
})();
</script>
'''
s=s.replace(anchor,script+"\n"+anchor,1)
p.write_text(s,encoding="utf-8")
print("installed settled repeat Property one-press rebind 17451")
