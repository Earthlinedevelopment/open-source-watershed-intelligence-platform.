#!/usr/bin/env python3
from pathlib import Path
p=Path('index.html')
s=p.read_text()
a="""    document.addEventListener('pointerdown',dismiss,true);
    document.addEventListener('wheel',dismiss,{capture:true,passive:true});"""
assert s.count(a)==1,('unexpected hint lifecycle',s.count(a))
s=s.replace(a,"""    /* Keep the instruction visible for its full temporary interval.
       Mapbox and overlapping controls can dispatch inconsistent pointer events. */""",1)
assert s.count("setTimeout(dismiss,20000);")==1
assert s.count("Place hand cursor over bare land to move map.")==1
assert s.count("reportPlaceLine123(baseData.d)")==1
assert s.count("reportAquiferContext123(baseData.d)")==1
p.write_text(s)
print('M126_HINT_PERSISTENCE_PATCHED')
