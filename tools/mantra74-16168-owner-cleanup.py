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

# Hidden legacy duplicate Run button no longer needs to mirror busy state.
one(
'''  new MutationObserver(sync).observe(main,{attributes:true,attributeFilter:["data-busy"]});
  sync();
''',
'''  sync();
''',
"remove hidden runBtnSide busy observer"
)

# 16168: preserve explicit completed-motion and Escape restoration, remove idle + full-document observer.
one(
"""    const m=map();if(m?.on){for(const ev of ['zoomend','moveend','rotateend','pitchend','idle'])m.on(ev,()=>{restoreGrab();restoreControls();if(tier()==='focus')refreshRender()})}
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){setTimeout(()=>{restoreControls();restoreGrab()},0)}},true);
    let controlsMutationRaf16168=0;
    const obs=new MutationObserver(()=>{if(controlsMutationRaf16168)return;controlsMutationRaf16168=requestAnimationFrame(()=>{controlsMutationRaf16168=0;restoreControls()})});obs.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
    setTimeout(()=>{restoreControls();restoreGrab();refreshRender()},0);
    setTimeout(()=>{restoreControls();restoreGrab();refreshRender()},800);""",
"""    const m=map();if(m?.on){for(const ev of ['zoomend','moveend','rotateend','pitchend'])m.on(ev,()=>{restoreGrab();restoreControls();if(tier()==='focus')refreshRender()})}
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){requestAnimationFrame(()=>{restoreControls();restoreGrab()})}},true);
    requestAnimationFrame(()=>{restoreControls();restoreGrab();refreshRender()});""",
"retire 16168 idle observer and retry ladder"
)

for bad in [
  'new MutationObserver(sync).observe(main',
  "['zoomend','moveend','rotateend','pitchend','idle']",
  'controlsMutationRaf16168',
  'setTimeout(()=>{restoreControls();restoreGrab();refreshRender()},800)'
]:
    if bad in s:
        raise RuntimeError("legacy owner remains: "+bad)

p.write_text(s,encoding="utf-8")
print("EARTHLINE_16168_OWNER_CLEANUP",len(before)-len(s))
