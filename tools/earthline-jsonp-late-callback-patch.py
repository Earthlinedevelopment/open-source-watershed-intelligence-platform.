#!/usr/bin/env python3
"""Exact-parent, client transport-only guard for JSONP scripts arriving after a timeout."""
from pathlib import Path
from hashlib import sha256
page=Path('index.html')
raw=page.read_text(encoding='utf8')
digest=sha256(raw.encode('utf8')).hexdigest()
expected='97ee47fb0742c74e31716770efb3483423fb604f5c9b8d7929ea82c5a18e68a5'
if digest!=expected:raise SystemExit('FAIL CLOSED: candidate HTML changed: '+digest)
old='function cleanup(){try{script.remove()}catch(_){}try{delete window[cb]}catch(_){window[cb]=undefined}}'
new='function cleanup(){try{script.remove()}catch(_){}try{window[cb]=()=>{};setTimeout(()=>{try{delete window[cb]}catch(_){window[cb]=undefined}},30000)}catch(_){}}'
if raw.count(old)!=1:raise SystemExit('FAIL CLOSED: JSONP cleanup owner not unique')
next_source=raw.replace(old,new,1)
if 'Slow it. <span class="sink">Sink it.</span> Spread it.' not in next_source:raise SystemExit('LOCKED MOTTO MISSING')
page.write_text(next_source,encoding='utf8')
print('EARTHLINE_JSONP_LATE_GUARD before_sha256='+digest+' after_sha256='+sha256(next_source.encode()).hexdigest())
print('JSONP transport semantics unchanged; no safety masks, science, or data modified')
