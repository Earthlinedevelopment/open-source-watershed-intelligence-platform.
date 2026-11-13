#!/usr/bin/env python3
"""Mantra 2: add crosshair movement instruction to October Focus UI."""
from pathlib import Path
import subprocess
p=Path("index.html")
expected="0e19fef1d95138e02786cfe470f3a804647dceda"
actual=subprocess.check_output(["git","hash-object","index.html"],text=True).strip()
assert actual==expected, f"STOP: unpinned HTML blob {actual} != {expected}"
s=p.read_text(encoding="utf-8")
old="function updateDeclareButton(){const b=ensureDeclareButton(),z=Number(map()?.getZoom?.()||0),show=focusActive()&&z>=15.5;b.classList.toggle('visible',show);b.disabled=b.dataset.busy==='1';return show}"
new="""function updateDeclareButton(){const b=ensureDeclareButton(),z=Number(map()?.getZoom?.()||0),show=focusActive()&&z>=15.5;b.classList.toggle('visible',show);b.disabled=b.dataset.busy==='1';let hint=document.getElementById('earthlineMoveMapHintM2');if(!hint&&document.body){hint=document.createElement('div');hint.id='earthlineMoveMapHintM2';hint.setAttribute('role','status');hint.textContent='Move the map to position the crosshair. Zoom in, then select Property Analysis.';hint.style.cssText='position:fixed;right:18px;bottom:230px;z-index:2147482499;max-width:250px;padding:9px 12px;border-radius:10px;background:rgba(6,26,35,.9);color:#f1fff6;border:1px solid rgba(78,201,255,.55);font:600 12px/1.35 "Noto Sans",sans-serif;pointer-events:none;box-sizing:border-box';document.body.appendChild(hint)}if(hint)hint.style.display=focusActive()?'block':'none';return show}"""
assert s.count(old)==1,"STOP: button owner changed"
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("MANTRA2_MOVE_MAP_HINT_PATCHED",len(s))
