#!/usr/bin/env python3
"""Bust stale browser cache for the two approved repaired presentation scripts."""
from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf8')
swaps=[
 ('src="earthline-launch-16872.js?v=16960"','src="earthline-launch-16872.js?v=20261128-map-first"'),
 ('src="earthline-elder-restored-17097.js"','src="earthline-elder-restored-17097.js?v=20261128-retry"')
]
for old,new in swaps:
  if s.count(new)==1: continue
  assert s.count(old)==1, 'FAIL CLOSED: unexpected approved script tag: '+old
  s=s.replace(old,new,1)
p.write_text(s,encoding='utf8')
print('Cache keys updated; all scripts, masks, and scientific algorithms preserved.')
