#!/usr/bin/env python3
"""Strip the unapproved/unreachable repeat-tip script from PR #55.
Only three-box CSS remains; base code untouched."""
from pathlib import Path
import subprocess
p=Path('index.html')
original=p.read_bytes()
assert subprocess.check_output(['git','hash-object','index.html'],text=True).strip()=='e3e4581ab980d2eaf6da13ee8f9a0e6b73aea773'
begin=b'<script id="mantra137-map-moving-tip-return">'
end=b'</script>'
assert original.count(begin)==1
i=original.index(begin)
j=original.index(end,i)+len(end)
revised=original[:i]+original[j:]
p.write_bytes(revised)
assert p.read_bytes()==revised
assert revised.count(b'<style id="mantra137-legacy-box-removal">')==1
assert begin not in revised
print('M137_STRIPPED_REPEAT_SCRIPT',j-i,'bytes')
