#!/usr/bin/env python3
"""Mantra 3: exact October rollback port + rebased Mantra 2 presentation patches."""
from pathlib import Path
import subprocess

def blob(path):
    return subprocess.check_output(["git","hash-object",str(path)],text=True).strip()

page=Path("index.html")
assert blob(page)=="0e19fef1d95138e02786cfe470f3a804647dceda", "STOP: October index is not pinned source"
s=page.read_text(encoding="utf-8")
assert s.endswith("</style>\n"), "STOP: changed October page tail"
assert "earthline-elder-restored-17097.js" not in s, "STOP: Elder engine already referenced"
assert blob("earthline-elder-restored-17097.js")=="406df3ea791f0d6f73497923e2a6b8a01d20543d"
assert blob("earthline-elder-worker-17129.js")=="95932bce4a42723f85b3d5905578851755b176c4"
page.write_text(s+'\n<!-- MANTRA3: load the Elder Trees engine (absent from the October build); same tag as November 2d858d5 -->\n<script defer src="earthline-elder-restored-17097.js"></script>\n',encoding="utf-8")
elder_port=blob(page)
assert elder_port.startswith("74f3c05d"), "STOP: Elder-only index blob mismatch: "+elder_port
print("MANTRA3_ELDER_PORT_BLOB",elder_port)

for script_name,source_sha in [
 ("tools/mantra2-property-render-stability.py","0ae3730f76e43fb57aca514e7a302b287c51eaa2"),
 ("tools/mantra2-move-map-hint.py","84c0b16a4e2d90f17ea840278428d39a87c4a439")
]:
    assert blob(script_name)==source_sha, "STOP: patch script modified: "+script_name
    source=Path(script_name).read_text(encoding="utf-8")
    pin='expected="0e19fef1d95138e02786cfe470f3a804647dceda"'
    assert source.count(pin)==1, "STOP: original patch pin changed"
    before=blob(page)
    rebound=source.replace(pin,'expected="'+before+'"',1)
    exec(compile(rebound,script_name,"exec"),{"__name__":"__main__","__file__":script_name})
    after=blob(page)
    assert after!=before, "STOP: no patch change in "+script_name
    print("MANTRA3_REBASED",script_name,"from",before,"to",after)
assert page.read_text().count('src="earthline-elder-restored-17097.js"')==1
print("MANTRA3_COMBINED_CANDIDATE",blob(page))
