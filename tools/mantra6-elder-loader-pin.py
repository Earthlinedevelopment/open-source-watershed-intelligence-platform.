#!/usr/bin/env python3
"""Mantra 6 only: ensure live page loads the new approved tree icon sprite instead of the cached Elder script."""
from pathlib import Path
import subprocess
p=Path('index.html')
expected='eb7dcc22c488aff582439abc668d1f6e52b47528'
actual=subprocess.check_output(['git','hash-object','index.html'],text=True).strip()
assert actual==expected, 'PIN MISMATCH: refuse unreviewed homepage'
s=p.read_text(encoding='utf-8')
old='<script defer src="earthline-elder-restored-17097.js"></script>'
new='<script defer src="earthline-elder-restored-17097.js?v=mantra6-tree-20261113"></script>'
assert s.count(old)==1, 'Elder loader not unique'
s=s.replace(old,new,1)
assert s.count('earthline-elder-restored-17097.js?v=mantra6-tree-20261113')==1
p.write_text(s,encoding='utf-8')
print('MANTRA6_ELDER_CACHE_BUST_PASS',len(s))
