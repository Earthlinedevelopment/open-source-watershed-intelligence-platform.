from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
before=s

def one(old,new,label):
    global s
    n=s.count(old)
    if n!=1:
        raise RuntimeError(f"{label}: expected 1 match, found {n}")
    s=s.replace(old,new,1)

one(
"""  function installPolicies(){if(aquiferInstalled)return;const m=map();if(!m?.on)return;aquiferInstalled=true;let raf=0;const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{persistVisualPolicy();updateScale();ensureReportButton()})};for(const ev of ['zoomend','moveend','style.load','resize'])m.on(ev,schedule);for(const ev of ['zoom','move','styledata','idle'])m.on(ev,()=>{});setInterval(()=>{updateScale();ensureReportButton()},1500);schedule()}""",
"""  function installPolicies(){if(aquiferInstalled)return;const m=map();if(!m?.on)return;aquiferInstalled=true;let raf=0;const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{persistVisualPolicy();updateScale();ensureReportButton()})};for(const ev of ['zoomend','moveend','style.load','resize'])m.on(ev,schedule);schedule()}""",
"remove no-op map listeners and 1500ms poll"
)

one(
"""  const reportReadinessObserver16151=new MutationObserver(()=>ensureReportButton());
  reportReadinessObserver16151.observe(document.documentElement,{attributes:true,attributeFilter:['data-earthline-run-state','data-earthline-active-run']});
""",
"",
"remove report readiness observer"
)

one(
"""  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',stamp,{once:true});else stamp();setTimeout(stamp,250);setTimeout(stamp,1100);setTimeout(stamp,2800);setInterval(()=>{removeMapButtons();ensureTopRun();ensureReportButton()},900);""",
"""  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',stamp,{once:true});else stamp();""",
"remove startup retries and 900ms poll"
)

old_install="""  function install(){stamp();installPanel16188();ensureBoundary().catch(error=>{lastError=error;console.error('[Earthline 16233] Vermont boundary unavailable',error)});setTimeout(stamp,1200);window.EARTHLINE_ARTIFACT_MANIFEST_16178="""
new_install="""  function install(){stamp();installPanel16188();window.EARTHLINE_ARTIFACT_MANIFEST_16178="""
one(old_install,new_install,"remove unconditional Vermont boundary preload and stamp retry")

# Structural checks
for bad in [
    "setInterval(()=>{updateScale();ensureReportButton()},1500)",
    "reportReadinessObserver16151",
    "setInterval(()=>{removeMapButtons();ensureTopRun();ensureReportButton()},900)",
    "installPanel16188();ensureBoundary().catch",
    "for(const ev of ['zoom','move','styledata','idle'])m.on(ev,()=>{})"
]:
    if bad in s:
        raise RuntimeError("legacy owner remains: "+bad)

p.write_text(s,encoding="utf-8")
print("EARTHLINE_LEGACY_PRESENTATION_CLEANUP",len(before)-len(s))
