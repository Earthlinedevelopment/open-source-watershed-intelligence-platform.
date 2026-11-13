#!/usr/bin/env python3
"""M211 candidate: enforce Earthline Property display slope <=4% and visible swale length >=12m.
Run from repo root against the exact audited M210 index.html; fail closed on unexpected source.
This is a candidate only: do not deploy without Arizona + regional regression testing.
"""
from pathlib import Path
import sys
p=Path("index.html")
s=p.read_text(encoding="utf-8")
start=s.index("function earthlineSwaleGeoJSON(){")
end=s.index("\nfunction earthlineSyncSwaleLayer()",start)
block=s[start:end]
edits=[
 ("earthlineSplitUsableSegments(s.pts,33)","earthlineSplitUsableSegments(s.pts,4)"),
 ("earthlineFinalSafeSegments15771(displaySeg,33)","earthlineFinalSafeSegments15771(displaySeg,4)"),
 ("if(!safeDisplay||safeDisplay.length<2)continue;","if(!safeDisplay||safeDisplay.length<2||earthlinePathLengthM(safeDisplay)<12)continue;")
]
if "M211 candidate" in block: raise SystemExit("Already patched; refusing second application")
for old,new in edits:
 if block.count(old)!=1: raise SystemExit(f"Unexpected renderer signature: {old!r}")
 block=block.replace(old,new)
block=block.replace("function earthlineSwaleGeoJSON(){","function earthlineSwaleGeoJSON(){\n  /* M211 candidate: Property map display slopes <=4% and length >=12m. */",1)
updated=s[:start]+block+s[end:]
assert updated.count("earthlineSplitUsableSegments(s.pts,4)")==1
assert updated.count("earthlineFinalSafeSegments15771(displaySeg,4)")==1
p.write_text(updated,encoding="utf-8")
print("M211 applied locally; NOT accepted or deployed. Check JS parsing and 2 Arizona Property sites x5 plus Regional before promotion.")
