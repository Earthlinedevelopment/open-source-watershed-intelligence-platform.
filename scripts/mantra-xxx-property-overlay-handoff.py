#!/usr/bin/env python3
"""MXXX: eliminate stale Regional SVG when Property layer becomes authoritative."""
from pathlib import Path
from hashlib import sha256
p=Path('index.html')
s=p.read_text('utf-8')
before=s
def swap(a,b,name):
    global s
    assert s.count(a)==1, f"REFUSE {name}: occurrence count {s.count(a)}"
    s=s.replace(a,b,1)
    print('PATCH:',name)

# Existing map-motion scheduler; no new timer or event owner.
swap('if(activeTier16168()==="property")return;',
     'if(activeTier16168()==="property"){const staleMxxx=document.getElementById("earthlineRegionalVectorOverlay16020");if(staleMxxx&&staleMxxx.childNodes.length)staleMxxx.replaceChildren();return;}',
     'clear stale Region/Focus SVG only when native Property owns map')

# Existing analysis completion listener; trigger even if no further camera motion.
swap("document.addEventListener('earthline:analysis-complete',ev=>{const tier=String(ev?.detail?.tier||ev?.detail?.mode||displayedTier16090()).toLowerCase();if(tier==='regional'||tier==='focus')scheduleDecorate16090();},{passive:true});",
     "document.addEventListener('earthline:analysis-complete',ev=>{const tier=String(ev?.detail?.tier||ev?.detail?.mode||displayedTier16090()).toLowerCase();if(tier==='property'){const staleMxxx=document.getElementById('earthlineRegionalVectorOverlay16020');if(staleMxxx&&staleMxxx.childNodes.length)staleMxxx.replaceChildren();}else if(tier==='regional'||tier==='focus')scheduleDecorate16090();},{passive:true});",
     'publish-tier stale overlay clearance in existing listener')
for mark in ["earthline-mantra-xxx-regional-clarity",
             "earthline-mantra-xxx-report-navigation",
             "Earthline is a free, community-focused tool",
             "EXCLUSIONS UNVERIFIED",
             "window.earthlineOpenVermontReport16151",
             "window.earthlineRenderRegionalOverlay16020",
             "earthlineMap","How Bioswales Work"]:
    assert mark in s
p.write_text(s,'utf-8')
print('IN SHA256',sha256(before.encode()).hexdigest())
print('OUT SHA256',sha256(s.encode()).hexdigest())
