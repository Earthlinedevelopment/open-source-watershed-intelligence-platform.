#!/usr/bin/env python3
"""Preserve the existing Property button's DOM touch target across sidebar reconciliations."""
from pathlib import Path
from hashlib import sha256
p=Path('index.html'); before=p.read_text(encoding='utf8')
digest=sha256(before.encode('utf8')).hexdigest()
expected='63d8ec01bd04d4dfbf51352fd3fce269c6c0b2eba793a13309a0e714dbfd8dde'
if digest!=expected: raise SystemExit('FAIL CLOSED: changed HTML SHA '+digest)
old="if(property.dataset.busy!=='1')span.innerHTML=propertyTargetMarkup16871(window.EARTHLINE_PROPERTY_TARGET_16201);"
new="if(property.dataset.busy!=='1'){const markup=propertyTargetMarkup16871(window.EARTHLINE_PROPERTY_TARGET_16201);if(span.innerHTML!==markup)span.innerHTML=markup;}"
if before.count(old)!=1: raise SystemExit('FAIL CLOSED: Property reconciliation owner count '+str(before.count(old)))
after=before.replace(old,new,1)
if after.count("setPanel16188(!(window.matchMedia")!=1: raise SystemExit('FAIL CLOSED: phone panel guard missing')
p.write_text(after,encoding='utf8')
print('EARTHLINE_PROPERTY_TOUCH_REPAIR before_sha256='+digest)
print('EARTHLINE_PROPERTY_TOUCH_REPAIR after_sha256='+sha256(after.encode('utf8')).hexdigest())
print('One UI mutation made idempotent; no engine, data or safety changes')
