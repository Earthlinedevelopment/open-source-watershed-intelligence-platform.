from pathlib import Path
p=Path('earthline-launch-16872.js')
s=p.read_text(encoding='utf-8')
old="function scheduleTranslation(){for(const ms of [0,80,260,700,1400])setTimeout(translateVisibleText,ms)}"
new="""function scheduleTranslation(){for(const ms of [0,80,260,700,1400])setTimeout(translateVisibleText,ms)}
let translationRaf16883=0;
function queueTranslation16883(){if(translationRaf16883)return;translationRaf16883=requestAnimationFrame(()=>{translationRaf16883=0;translateVisibleText()})}
function installTranslationRepaintGuard16883(){
  const bind=()=>{
    const roots=[document.getElementById('earthlinePanel16188'),document.getElementById('earthlineRail16188'),document.getElementById('earthlineHamburgerMenu16233')].filter(Boolean);
    if(!roots.length)return false;
    for(const root of roots){
      if(root.dataset.earthlineTranslationGuard16883==='1')continue;
      root.dataset.earthlineTranslationGuard16883='1';
      new MutationObserver(muts=>{if(muts.some(m=>m.type==='characterData'||m.type==='childList'))queueTranslation16883()}).observe(root,{subtree:true,childList:true,characterData:true});
    }
    return true;
  };
  if(bind())return;
  const bodyGuard=new MutationObserver(()=>{if(bind())bodyGuard.disconnect()});
  bodyGuard.observe(document.body,{subtree:true,childList:true});
}"""
if s.count(old)!=1: raise SystemExit(f'scheduleTranslation anchor count {s.count(old)}')
s=s.replace(old,new)
old2="function install(){installRail();modal();renderAccount();refreshSessionIfNeeded();document.addEventListener('change',e=>syncLanguageFromTarget(e.target),true);document.addEventListener('click',e=>syncFreeCrosshairBeforeProperty(e.target),true);new MutationObserver(()=>{renderAccount();scheduleTranslation()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});loadConfig();scheduleTranslation();installTelemetry();document.documentElement.dataset.earthlineLaunch16872='ready'}"
new2="function install(){installRail();modal();renderAccount();refreshSessionIfNeeded();document.addEventListener('change',e=>syncLanguageFromTarget(e.target),true);document.addEventListener('click',e=>syncFreeCrosshairBeforeProperty(e.target),true);new MutationObserver(()=>{renderAccount();scheduleTranslation()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});loadConfig();scheduleTranslation();installTranslationRepaintGuard16883();installTelemetry();document.documentElement.dataset.earthlineLaunch16872='ready'}"
if s.count(old2)!=1: raise SystemExit(f'install anchor count {s.count(old2)}')
s=s.replace(old2,new2)
p.write_text(s,encoding='utf-8')
print('patched launch UI repaint guard 16883')
