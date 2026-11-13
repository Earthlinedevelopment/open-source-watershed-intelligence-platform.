#!/usr/bin/env python3
"""Mantra 6: exact, fail-closed presentation-only repair for repeated Mapbox swale writes."""
from pathlib import Path
import subprocess

path=Path("index.html")
expected="d73c8cd7b97d7afbfb4a1e9338009a33cca4f336"
actual=subprocess.check_output(["git","hash-object","index.html"],text=True).strip()
assert actual==expected, f"UNPINNED INDEX: {actual} != {expected}"
src=path.read_text(encoding="utf8")
pairs=[
("""  function visible(id,on){const mp=map();try{if(mp?.getLayer?.(id))mp.setLayoutProperty(id,'visibility',on?'visible':'none')}catch(_){}}""",
 """  function visible(id,on){const mp=map();try{if(mp?.getLayer?.(id)){const next=on?'visible':'none';if((mp.getLayoutProperty(id,'visibility')||'visible')!==next)mp.setLayoutProperty(id,'visibility',next)}}catch(_){}}"""),
("""  function applyWidth(){const mp=map(),w=widthPx();lastWidth=w;try{if(mp?.getLayer?.(LAYERS.casing))mp.setPaintProperty(LAYERS.casing,'line-width',w+2);if(mp?.getLayer?.(LAYERS.neutral))mp.setPaintProperty(LAYERS.neutral,'line-width',Math.max(5,w*.82));if(mp?.getLayer?.(LAYERS.up))mp.setPaintProperty(LAYERS.up,'line-width',w);if(mp?.getLayer?.(LAYERS.flip))mp.setPaintProperty(LAYERS.flip,'line-width',w)}catch(_){}return w}""",
 """  function applyWidth(){const mp=map(),w=widthPx();lastWidth=w;try{for(const [id,v] of [[LAYERS.casing,w+2],[LAYERS.neutral,Math.max(5,w*.82)],[LAYERS.up,w],[LAYERS.flip,w]])if(mp?.getLayer?.(id)&&mp.getPaintProperty?.(id,'line-width')!==v)mp.setPaintProperty(id,'line-width',v)}catch(_){}return w}""")
]
for original,replacement in pairs:
    assert src.count(original)==1, "NOT EXACT ONE render-owner anchor"
    src=src.replace(original,replacement,1)
path.write_text(src,encoding="utf8")
print("MANTRA6_SWALERENDER_IDEMPOTENT_PATCH_PASS",len(src))
