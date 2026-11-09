#!/usr/bin/env python3
"""Mantra 126: preserve accepted US-facing home camera on Hotfix 3 candidate.
Fail closed if the candidate source no longer matches the reviewed anchor.
"""
from pathlib import Path
p=Path('index.html')
raw=p.read_bytes()
old=b"m.jumpTo({center:[0,18],zoom:1.25,bearing:0,pitch:0})"
new=b"m.jumpTo({center:[-96,39],zoom:1.25,bearing:0,pitch:0})"
if raw.count(old)==1 and raw.count(new)==0:
    p.write_bytes(raw.replace(old,new,1))
    print("M126_PATCHED_US_GLOBE_CAMERA")
elif raw.count(old)==0 and raw.count(new)==1:
    print("M126_US_GLOBE_CAMERA_ALREADY_CORRECT")
else:
    raise SystemExit("BLOCKED: unexpected or ambiguous globe initialization; no edits")
assert p.read_bytes().count(new)==1
