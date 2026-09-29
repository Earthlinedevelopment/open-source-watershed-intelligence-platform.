from pathlib import Path
p=Path('earthline-launch-16872.js')
s=p.read_text(encoding='utf-8')

# Make language translation authoritative after any late native UI repaint.
guard="""function scheduleTranslation(){for(const ms of [0,80,260,700,1400])setTimeout(translateVisibleText,ms)}
let translationRaf16885=0;
function queueTranslation16885(){if(translationRaf16885)return;translationRaf16885=requestAnimationFrame(()=>{translationRaf16885=0;translateVisibleText()})}
function installTranslationRepaintGuard16885(){
  const bind=()=>{
    const roots=[document.getElementById('earthlinePanel16188'),document.getElementById('earthlineRail16188'),document.getElementById('earthlineHamburgerMenu16233')].filter(Boolean);
    if(!roots.length)return false;
    for(const root of roots){
      if(root.dataset.earthlineTranslationGuard16885==='1')continue;
      root.dataset.earthlineTranslationGuard16885='1';
      new MutationObserver(muts=>{if(muts.some(m=>m.type==='characterData'||m.type==='childList'))queueTranslation16885()}).observe(root,{subtree:true,childList:true,characterData:true});
    }
    return true;
  };
  if(bind())return;
  const bodyGuard=new MutationObserver(()=>{if(bind())bodyGuard.disconnect()});
  bodyGuard.observe(document.body,{subtree:true,childList:true});
}"""
if 'installTranslationRepaintGuard16885' not in s:
    for old in [
        "function scheduleTranslation(){for(const ms of [0,80,260,700,1400,2200,3200])setTimeout(translateVisibleText,ms)}",
        "function scheduleTranslation(){for(const ms of [0,80,260,700,1400])setTimeout(translateVisibleText,ms)}"
    ]:
        if old in s:
            s=s.replace(old,guard,1)
            break
    else:
        raise SystemExit('scheduleTranslation anchor not found')

install_old="function install(){installRail();modal();renderAccount();refreshSessionIfNeeded();document.addEventListener('change',e=>syncLanguageFromTarget(e.target),true);document.addEventListener('click',e=>syncFreeCrosshairBeforeProperty(e.target),true);new MutationObserver(()=>{renderAccount();scheduleTranslation()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});loadConfig();scheduleTranslation();installTelemetry();document.documentElement.dataset.earthlineLaunch16872='ready'}"
install_new="function install(){installRail();modal();renderAccount();refreshSessionIfNeeded();document.addEventListener('change',e=>syncLanguageFromTarget(e.target),true);document.addEventListener('click',e=>syncFreeCrosshairBeforeProperty(e.target),true);new MutationObserver(()=>{renderAccount();scheduleTranslation()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});loadConfig();scheduleTranslation();installTranslationRepaintGuard16885();installTelemetry();document.documentElement.dataset.earthlineLaunch16872='ready'}"
if 'installTranslationRepaintGuard16885();installTelemetry()' not in s:
    if s.count(install_old)!=1: raise SystemExit(f'install anchor count {s.count(install_old)}')
    s=s.replace(install_old,install_new,1)

# Withhold Donate / Merchandise unless a real destination is configured.
old2="function donateTarget(){try{return String(window.EARTHLINE_DONATE_URL_16872||localStorage.getItem('earthlineDonateUrl16872')||'')}catch(_){return String(window.EARTHLINE_DONATE_URL_16872||'')}}\nfunction donate(){track('donate_click');const u=donateTarget();if(u){window.open(u,'_blank','noopener');return}window.open('donate.html','_blank','noopener')}"
new2="function donateTarget(){try{return String(window.EARTHLINE_DONATE_URL_16872||localStorage.getItem('earthlineDonateUrl16872')||'')}catch(_){return String(window.EARTHLINE_DONATE_URL_16872||'')}}\nfunction merchTarget(){try{return String(window.EARTHLINE_MERCH_URL_16872||localStorage.getItem('earthlineMerchUrl16872')||'')}catch(_){return String(window.EARTHLINE_MERCH_URL_16872||'')}}\nfunction donate(){track('donate_click');const u=donateTarget();if(u)window.open(u,'_blank','noopener')}"
if 'function merchTarget()' not in s:
    if s.count(old2)!=1: raise SystemExit(f'donate anchor count {s.count(old2)}')
    s=s.replace(old2,new2,1)

old3="function installRail(){if(document.getElementById('earthlineLaunchLogin16872'))return;const rail=document.getElementById('earthlineRail16188');const contact=document.getElementById('earthlineRailContact16512');const host=rail||contact?.parentElement||document.body;const mk=(id,txt)=>{const b=document.createElement('button');b.id=id;b.type='button';b.className=(rail?'el-rail-control-16188 ':'')+'earthline-launch-rail-btn-16872';b.textContent=txt;b.setAttribute('aria-label',txt);return b};const L=mk('earthlineLaunchLogin16872',t().login),D=mk('earthlineLaunchDonate16872',t().donate),M=mk('earthlineLaunchMerch16872',t().merch);L.onclick=()=>openAccount('login');D.onclick=donate;M.onclick=()=>{track('merch_click');window.open('merchandise.html','_blank','noopener')};if(rail){rail.append(L,D,M)}else if(contact){host.append(L,D,M)}else{const wrap=document.createElement('div');wrap.id='earthlineLaunchFallbackRail16872';wrap.append(L,D,M);document.body.appendChild(wrap)}renderAccount()}"
new3="function installRail(){if(document.getElementById('earthlineLaunchLogin16872'))return;const rail=document.getElementById('earthlineRail16188');const contact=document.getElementById('earthlineRailContact16512');const host=rail||contact?.parentElement||document.body;const mk=(id,txt)=>{const b=document.createElement('button');b.id=id;b.type='button';b.className=(rail?'el-rail-control-16188 ':'')+'earthline-launch-rail-btn-16872';b.textContent=txt;b.setAttribute('aria-label',txt);return b};const L=mk('earthlineLaunchLogin16872',t().login),D=donateTarget()?mk('earthlineLaunchDonate16872',t().donate):null,M=merchTarget()?mk('earthlineLaunchMerch16872',t().merch):null;L.onclick=()=>openAccount('login');if(D)D.onclick=donate;if(M)M.onclick=()=>{track('merch_click');window.open(merchTarget(),'_blank','noopener')};const items=[L,D,M].filter(Boolean);if(rail){rail.append(...items)}else if(contact){host.append(...items)}else{const wrap=document.createElement('div');wrap.id='earthlineLaunchFallbackRail16872';wrap.append(...items);document.body.appendChild(wrap)}renderAccount()}"
if "D=donateTarget()?" not in s:
    if s.count(old3)!=1: raise SystemExit(f'installRail anchor count {s.count(old3)}')
    s=s.replace(old3,new3,1)

old4="window.EARTHLINE_LAUNCH_16872={build:BUILD,quota,consumePaidSearch,createAccount,signIn,signOut,openAccount,donateTarget,limits:()=>({...config}),isConfiguredDonation:()=>!!donateTarget(),translateVisibleText,centralClaim,track,refreshSessionIfNeeded};"
new4="window.EARTHLINE_LAUNCH_16872={build:BUILD,quota,consumePaidSearch,createAccount,signIn,signOut,openAccount,donateTarget,merchTarget,limits:()=>({...config}),isConfiguredDonation:()=>!!donateTarget(),isConfiguredMerch:()=>!!merchTarget(),translateVisibleText,centralClaim,track,refreshSessionIfNeeded};"
if 'isConfiguredMerch' not in s:
    if s.count(old4)!=1: raise SystemExit(f'export anchor count {s.count(old4)}')
    s=s.replace(old4,new4,1)

p.write_text(s,encoding='utf-8')
print('patched exact launch file: authoritative repaint guard + withheld unconfigured commerce')
