from pathlib import Path
p=Path('earthline-launch-16872.js')
s=p.read_text(encoding='utf-8')
old="function scheduleTranslation(){for(const ms of [0,80,260,700,1400])setTimeout(translateVisibleText,ms)}"
new="function scheduleTranslation(){for(const ms of [0,80,260,700,1400,2200,3200])setTimeout(translateVisibleText,ms)}"
if old in s:s=s.replace(old,new)
start=s.find("let translationRaf16885=0;")
end=s.find("function showToast(msg)")
if start!=-1 and end>start:s=s[:start]+s[end:]
old_install="function install(){installRail();modal();renderAccount();refreshSessionIfNeeded();document.addEventListener('change',e=>syncLanguageFromTarget(e.target),true);document.addEventListener('click',e=>syncFreeCrosshairBeforeProperty(e.target),true);new MutationObserver(()=>{renderAccount();scheduleTranslation()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});loadConfig();scheduleTranslation();installTranslationRepaintGuard16885();installTelemetry();document.documentElement.dataset.earthlineLaunch16872='ready'}"
new_install="function install(){installRail();modal();renderAccount();refreshSessionIfNeeded();document.addEventListener('change',e=>{syncLanguageFromTarget(e.target);setTimeout(()=>{renderAccount();translateVisibleText()},0);setTimeout(translateVisibleText,90)},false);document.addEventListener('click',e=>syncFreeCrosshairBeforeProperty(e.target),true);new MutationObserver(()=>{renderAccount();scheduleTranslation()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});loadConfig();scheduleTranslation();installTelemetry();document.documentElement.dataset.earthlineLaunch16872='ready'}"
if old_install not in s:raise SystemExit('install anchor missing')
s=s.replace(old_install,new_install,1)
p.write_text(s,encoding='utf-8')
print('patched native-first language ownership; removed competing subtree repaint observer')