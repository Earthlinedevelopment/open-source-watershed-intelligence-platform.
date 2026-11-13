#!/usr/bin/env python3
"""Mantra 2: narrow October Property presentation fix; never modifies science."""
from pathlib import Path
import subprocess
p=Path("index.html")
expected="0e19fef1d95138e02786cfe470f3a804647dceda"
actual=subprocess.check_output(["git","hash-object","index.html"],text=True).strip()
assert actual==expected, f"STOP: unpinned HTML blob {actual} != {expected}"
s=p.read_text(encoding="utf-8")
old="async function syncTexture(reason='sync'){clearTimeout(syncQueued);const mp=map(),active=propertyActive();if(!mp)return false;updateDeclareButton();syncPortal();restoreGrab();if(!active){"
new="async function syncTexture(reason='sync'){clearTimeout(syncQueued);const mp=map(),active=propertyActive();if(!mp)return false;updateDeclareButton();syncPortal();restoreGrab();if(active&&['moveend','zoomend','rotateend','pitchend','idle'].includes(reason)&&lastSignature&&window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169?.sourceReady&&mp.getSource?.(SOURCE)){/* MANTRA2: Mapbox handles panning published Property texture. Avoid repeating layer reorders/visibility on idle and camera events; geometry remains unchanged. */applyWidth();return true;}if(!active){"
assert s.count(old)==1,"STOP: Property sync owner changed"
assert s.count("async function syncTexture(")==1,"STOP: multiple sync owners"
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("MANTRA2_PROPERTY_RENDER_STABILITY_PATCHED",len(s))
