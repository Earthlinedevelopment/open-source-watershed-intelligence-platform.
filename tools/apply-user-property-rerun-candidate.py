#!/usr/bin/env python3
"""Apply only the three source-layer exclusions; require supplied candidate byte hash."""
from pathlib import Path
from hashlib import sha256
p=Path('index.html')
old=p.read_bytes()
expected='ae0421c7a659f6b8e86e5453df66ea9e13fb12eccb86322b3569b55e4676d52a'
guard=b'if(/^(earthline|el)-/i.test(String(l.id||"")))return false; /* own drawn layers are never mapped exclusions */'
anchors=[
 b'const layerIds=(style.layers||[]).filter(l=>{\n',
 b'const layers=(style.layers||[]).filter(l=>{\n',
 b'return (style&&style.layers||[]).filter(l=>{\n',
]
if sha256(old).hexdigest()==expected:
 print('EXACT_USER_CANDIDATE_ALREADY_PRESENT');quit()
assert guard not in old, 'Unexpected existing guard: refuse to alter'
new=old
for a in anchors:
 assert new.count(a)==1, f'Unexpected anchor count {new.count(a)}: {a!r}'
 whitespace=b'      ' if a.startswith(b'const layerIds=') else b'        '
 new=new.replace(a,a+whitespace+guard+b'\n',1)
actual=sha256(new).hexdigest()
assert actual==expected, f'SHA mismatch {actual} != {expected}; no edits'
p.write_bytes(new)
print('EXACT_USER_CANDIDATE_APPLIED',actual)
