from pathlib import Path
import re
p=Path("index.html")
s=p.read_text(encoding="utf-8")
before=s

def must_replace(old,new,label):
    global s
    n=s.count(old)
    if n!=1:
        raise RuntimeError(f"{label}: expected 1 occurrence, found {n}")
    s=s.replace(old,new,1)

# 16178: analysis-complete does one bounded reconciliation, not six delayed rewrites.
old="""document.addEventListener('earthline:analysis-complete',ev=>{const mode=String(ev?.detail?.tier||ev?.detail?.mode||'').toLowerCase(),d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null,shown=String(d&&(d.tier||d.mode)||'').toLowerCase();/* 16346: core publication is not the Regional Orb terminal; reconcileOrbTerminal16243 owns same-token context/failure terminal. */if(mode==='regional'||shown==='regional')corridorTipRegionalReady16252=true;setTimeout(syncRegionalOrb16233,50);setTimeout(reconcilePanel16188,80);for(const delay of [250,650,1200,2200,4000])setTimeout(maybeShowCorridorTip16248,delay)},{passive:true});"""
new="""document.addEventListener('earthline:analysis-complete',ev=>{const mode=String(ev?.detail?.tier||ev?.detail?.mode||'').toLowerCase(),d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null,shown=String(d&&(d.tier||d.mode)||'').toLowerCase();if(mode==='regional'||shown==='regional')corridorTipRegionalReady16252=true;setTimeout(()=>{syncRegionalOrb16233();reconcileOrbTerminal16243();reconcilePanel16188();maybeShowCorridorTip16248()},100)},{passive:true});"""
must_replace(old,new,"analysis-complete reconciliation")

old="""setInterval(()=>{syncRegionalOrb16233();const p=document.getElementById('earthlineDeclareProperty16169');if(p)ensureOrb16233('earthlineDeclareProperty16169');reconcileOrbTerminal16243();const now16270=Date.now();if(now16270-lastCorridorTipCheck16270>=500){lastCorridorTipCheck16270=now16270;maybeShowCorridorTip16248()}},120);"""
new="""const runStateObserver17680=new MutationObserver(()=>{syncRegionalOrb16233();const p=document.getElementById('earthlineDeclareProperty16169');if(p)ensureOrb16233('earthlineDeclareProperty16169');reconcileOrbTerminal16243()});runStateObserver17680.observe(document.documentElement,{attributes:true,attributeFilter:['data-earthline-run-state','data-earthline-property-run-state']});"""
must_replace(old,new,"120ms orb poll")

# 16158: DOM/map events already reconcile; remove periodic enforcement and no-op map event owners.
must_replace(
"for(const ev of ['zoom','styledata','idle'])m.on(ev,()=>{});",
"",
"16158 no-op map listeners"
)
# tolerate minified single line around interval
s,n=re.subn(r"clearInterval\(enforceTimer\);enforceTimer=setInterval\(\(\)=>\{correctMotto\(\);ensureBuildStamp\(\);ensureBlueBrand\(\);wrapCorridorDetail\(\)\},700\);","",s,count=1)
if n!=1: raise RuntimeError(f"16158 700ms interval: expected 1, found {n}")

# 16169: remove idle-driven presentation rewrites, periodic enforcement and second startup retry.
must_replace(
"for(const ev of ['load','style.load','zoomend','moveend','rotateend','pitchend','idle'])mp.on(ev,()=>",
"for(const ev of ['load','style.load','zoomend','moveend','rotateend','pitchend'])mp.on(ev,()=>",
"16169 idle listener"
)
s,n=re.subn(r"setInterval\(\(\)=>\{updateBuild\(\);syncPortal\(\);updateDeclareButton\(\)\},900\);","",s,count=1)
if n!=1: raise RuntimeError(f"16169 900ms interval: expected 1, found {n}")
must_replace("scheduleSync('install-force',0);scheduleSync('install-settled-force',900);","scheduleSync('install-force',0);","16169 startup retry")

# 16168: remove no-op high-frequency map event hooks and two late restyles.
must_replace(
"for(const ev of ['styledata','idle'])m.on(ev,()=>{});",
"",
"16168 no-op map listeners"
)
must_replace(
"setTimeout(applyTierStyling,0);setTimeout(applyTierStyling,500);setTimeout(applyTierStyling,1600);",
"requestAnimationFrame(applyTierStyling);",
"16168 late restyle retries"
)

# Validation scoped to active scripts.
def script_body(script_id):
    m=re.search(r'<script\b[^>]*\bid=["\']'+re.escape(script_id)+r'["\'][^>]*>([\s\S]*?)</script>',s,re.I)
    if not m: raise RuntimeError("missing script "+script_id)
    return m.group(1)

for sid in [
    "earthline-build-16178-state-identity-boundary-timeout",
    "earthline-progressive-focus-16158-js",
    "earthline-build-16169-js"
]:
    body=script_body(sid)
    if "setInterval(" in body:
        raise RuntimeError("polling interval remains in "+sid)

for bad in [
    "[250,650,1200,2200,4000]",
    "setInterval(()=>{syncRegionalOrb16233",
    "setInterval(()=>{updateBuild();syncPortal();updateDeclareButton()},900)",
    "setInterval(()=>{correctMotto();ensureBuildStamp();ensureBlueBrand();wrapCorridorDetail()},700)",
    "['zoom','styledata','idle']",
    "['styledata','idle']"
]:
    if bad in s: raise RuntimeError("legacy polling/no-op owner remains: "+bad)

for good in [
    "runStateObserver17680.observe(document.documentElement",
    "bodyObserver.observe(document.body",
    "window.earthlineSetPropertyTarget16201=setPropertyTarget16201",
    "window.earthlineAnalyzeThisLocation16158=runFocus",
    "window.earthlineSyncPropertyTexture16169=syncTexture"
]:
    if good not in s: raise RuntimeError("event owner missing: "+good)

p.write_text(s.rstrip()+"\n",encoding="utf-8")
print("EARTHLINE_17680_EVENT_DRIVEN_LIFECYCLE",len(before),len(s),len(before)-len(s))
