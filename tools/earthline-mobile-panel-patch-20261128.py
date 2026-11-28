#!/usr/bin/env python3
"""One-time, exact-parent Earthline phone panel correction (no scientific changes)."""
from pathlib import Path
import hashlib

page = Path('index.html')
before = page.read_text(encoding='utf-8')
edits = [
    (
        "bindPropertyTargetMove16201();setPanel16188(true);reconcilePanel16188();",
        "bindPropertyTargetMove16201();setPanel16188(!(window.matchMedia&&window.matchMedia('(max-width:760px)').matches));reconcilePanel16188();",
    ),
    (
        "if(mode==='regional'||shown==='regional')corridorTipRegionalReady16252=true;setTimeout(syncRegionalOrb16233,50);",
        "if(mode==='regional'||shown==='regional')corridorTipRegionalReady16252=true;if(window.matchMedia&&window.matchMedia('(max-width:760px)').matches&&(mode==='regional'||mode==='property'||shown==='regional'||shown==='property'))setPanel16188(false);setTimeout(syncRegionalOrb16233,50);",
    ),
]
after = before
for old, new in edits:
    occurrences = after.count(old)
    if occurrences != 1:
        raise SystemExit(f'FAIL CLOSED: expected one source owner; got {occurrences} for {old[:70]}')
    after = after.replace(old, new, 1)
if 'Slow it. <span class="sink">Sink it.</span> Spread it.' not in after:
    raise SystemExit('FAIL CLOSED: locked Earthline motto not preserved')
if len(after) - len(before) != 234:
    raise SystemExit('FAIL CLOSED: unexpected replacement size')
page.write_text(after, encoding='utf-8')
print('EARTHLINE_MOBILE_PATCH before_sha256=' + hashlib.sha256(before.encode()).hexdigest())
print('EARTHLINE_MOBILE_PATCH after_sha256=' + hashlib.sha256(after.encode()).hexdigest())
print('EARTHLINE_MOBILE_PATCH groups=2; scientific owners unchanged')
