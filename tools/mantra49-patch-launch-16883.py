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

old_rail="function installRail(){if(document.getElementById('earthlineLaunchLogin16872'))return;const rail=document.getElementById('earthlineRail16188');const contact=document.getElementById('earthlineRailContact16512');const host=rail||contact?.parentElement||document.body;const mk=(id,txt)=>{const b=document.createElement('button');b.id=id;b.type='button';b.className=(rail?'el-rail-control-16188 ':'')+'earthline-launch-rail-btn-16872';b.textContent=txt;b.setAttribute('aria-label',txt);return b};const L=mk('earthlineLaunchLogin16872',t().login),D=donateTarget()?mk('earthlineLaunchDonate16872',t().donate):null,M=merchTarget()?mk('earthlineLaunchMerch16872',t().merch):null;L.onclick=()=>openAccount('login');if(D)D.onclick=donate;if(M)M.onclick=()=>{track('merch_click');window.open(merchTarget(),'_blank','noopener')};const items=[L,D,M].filter(Boolean);if(rail){rail.append(...items)}else if(contact){host.append(...items)}else{const wrap=document.createElement('div');wrap.id='earthlineLaunchFallbackRail16872';wrap.append(...items);document.body.appendChild(wrap)}renderAccount()}"
new_rail="""function adoptLaunchRail16887(){const rail=document.getElementById('earthlineRail16188');if(!rail)return false;const items=['earthlineLaunchLogin16872','earthlineLaunchDonate16872','earthlineLaunchMerch16872'].map(id=>document.getElementById(id)).filter(Boolean);for(const item of items){item.classList.add('el-rail-control-16188');if(item.parentElement!==rail)rail.appendChild(item)}document.getElementById('earthlineLaunchFallbackRail16872')?.remove();return true}
function installLaunchRailAdoption16887(){if(adoptLaunchRail16887())return;const mo=new MutationObserver(()=>{if(adoptLaunchRail16887())mo.disconnect()});mo.observe(document.body,{childList:true,subtree:true})}
function installRail(){if(document.getElementById('earthlineLaunchLogin16872')){installLaunchRailAdoption16887();return}const rail=document.getElementById('earthlineRail16188');const contact=document.getElementById('earthlineRailContact16512');const host=rail||contact?.parentElement||document.body;const mk=(id,txt)=>{const b=document.createElement('button');b.id=id;b.type='button';b.className=(rail?'el-rail-control-16188 ':'')+'earthline-launch-rail-btn-16872';b.textContent=txt;b.setAttribute('aria-label',txt);return b};const L=mk('earthlineLaunchLogin16872',t().login),D=donateTarget()?mk('earthlineLaunchDonate16872',t().donate):null,M=merchTarget()?mk('earthlineLaunchMerch16872',t().merch):null;L.onclick=()=>openAccount('login');if(D)D.onclick=donate;if(M)M.onclick=()=>{track('merch_click');window.open(merchTarget(),'_blank','noopener')};const items=[L,D,M].filter(Boolean);if(rail){rail.append(...items)}else if(contact){host.append(...items)}else{const wrap=document.createElement('div');wrap.id='earthlineLaunchFallbackRail16872';wrap.append(...items);document.body.appendChild(wrap)}installLaunchRailAdoption16887();renderAccount()}"""
if 'function adoptLaunchRail16887()' not in s:
    if s.count(old_rail)!=1: raise SystemExit(f'installRail anchor count {s.count(old_rail)}')
    s=s.replace(old_rail,new_rail,1)
p.write_text(s,encoding='utf-8')
print('patched Run label guard + native rail adoption; no persistent polling')