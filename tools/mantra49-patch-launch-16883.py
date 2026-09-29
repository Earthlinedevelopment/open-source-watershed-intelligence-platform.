from pathlib import Path
p=Path('earthline-launch-16872.js')
s=p.read_text(encoding='utf-8')
anchor="function scheduleTranslation(){for(const ms of [0,80,260,700,1400,2200,3200])setTimeout(translateVisibleText,ms)}"
if anchor not in s: raise SystemExit('schedule anchor missing')
if 'installRunLabelGuard16886' not in s:
    guard="""function installRunLabelGuard16886(){
  const bind=()=>{const b=document.getElementById('runBtn');if(!b||b.dataset.earthlineRunLangGuard16886==='1')return !!b;b.dataset.earthlineRunLangGuard16886='1';new MutationObserver(()=>requestAnimationFrame(translateVisibleText)).observe(b,{subtree:true,childList:true,characterData:true});translateVisibleText();return true};
  if(bind())return;const mo=new MutationObserver(()=>{if(bind())mo.disconnect()});mo.observe(document.body,{subtree:true,childList:true});
}"""
    s=s.replace(anchor,anchor+'\n'+guard,1)
old="loadConfig();scheduleTranslation();installTelemetry();document.documentElement.dataset.earthlineLaunch16872='ready'"
new="loadConfig();scheduleTranslation();installRunLabelGuard16886();installTelemetry();document.documentElement.dataset.earthlineLaunch16872='ready'"
if old not in s and new not in s: raise SystemExit('install insertion anchor missing')
if old in s:s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('patched narrow Run Analysis language guard only')