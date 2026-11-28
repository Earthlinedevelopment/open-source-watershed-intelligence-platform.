#!/usr/bin/env python3
"""Phone-only larger touch target for existing governed Property action."""
from pathlib import Path
from hashlib import sha256
p=Path('index.html');before=p.read_text(encoding='utf8');digest=sha256(before.encode()).hexdigest()
expected='e871374d6075ef84db904ab02ce957783cca2b5b34053d960460c06380d0202e'
if digest!=expected:raise SystemExit('FAIL CLOSED: unexpected candidate '+digest)
needle='<!-- MANTRA3: load the Elder Trees engine'
if before.count(needle)!=1:raise SystemExit('FAIL CLOSED: target anchor ambiguity')
patch='''<style id="earthline-mobile-property-tap-20261128">
@media(max-width:760px){
  #earthlinePropertySlot16188 #earthlineDeclareProperty16169{
    height:44px!important;
    min-height:44px!important;
    max-height:44px!important;
    touch-action:manipulation!important;
  }
}
</style>
'''
after=before.replace(needle,patch+needle,1)
p.write_text(after,encoding='utf8')
print('EARTHLINE_PHONE_TAP before='+digest+' after='+sha256(after.encode()).hexdigest())
print('Property touch surface now 44px only at viewport <=760px; science unchanged')
