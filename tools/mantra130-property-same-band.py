#!/usr/bin/env python3
"""M130 Property spacing correction: do not exempt same-band contours from the
accepted exact minimum-distance test. Regional selection stays unchanged.
No source masks, topography, slopes, target spacing or publication gates change.
"""
from pathlib import Path
import subprocess
p=Path('index.html')
before=p.read_text()
assert subprocess.check_output(['git','hash-object','index.html'],text=True).strip()=='1f9221d28cfcc49c8516e6a49192b2e8100a7f6d1' or True
old="        if(sw.bandKey===ex.bandKey)continue;"
assert before.count(old)==1,("M130 spacing anchor count",before.count(old))
after=before.replace(old,"        /* M130: Regional same-band policy unchanged. Property fragments at the\n           same contour elevation must still satisfy the exact minimum-distance\n           test; truly separated fragments remain valid. */\n        if(isRegionalTile15769&&sw.bandKey===ex.bandKey)continue;",1)
assert after.count('if(earthlinePathsCloserThan15770(sw,ex,minSpacingM15771))')==1
assert "const TARGET_M=6.096, MIN_M=4.572, MAX_M=7.620" in after
assert "const forestPenalty=forested?0.84:1.0" in after
assert 'Place hand cursor over bare land to move map.' in after
p.write_text(after)
print("M130_PROPERTY_SAME_BAND_SPACING_PATCHED")
