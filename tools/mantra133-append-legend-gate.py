#!/usr/bin/env python3
from pathlib import Path
import subprocess
p=Path('index.html')
old=p.read_bytes()
assert subprocess.check_output(['git','hash-object','index.html'],text=True).strip()=='37544de5aaeb8d087bf85d8beacc656ed1e2f205', 'Unexpected production index parent'
addition='''<style id="earthline-legend-home-gate-css">
/* Legends explain analysis results; on the home globe, before any analysis, they only cover the map. */
html:not([data-earthline-has-results]) #earthlineSwaleLegend16050,
html:not([data-earthline-has-results]) #earthlineAquiferLegend16070,
html:not([data-earthline-has-results]) #earthlineDiagramLegend16080{display:none!important}
</style>
<script id="earthline-legend-home-gate-js">
document.addEventListener('earthline:analysis-complete',function(){document.documentElement.setAttribute('data-earthline-has-results','')},{passive:true});
</script>
'''.encode()
assert len(addition)==596,len(addition)
assert b'earthline-legend-home-gate-css' not in old
assert b'data-earthline-has-results' not in old
assert b"document.dispatchEvent(new CustomEvent('earthline:analysis-complete'" in old
assert b'rejectSlopeAbove4M131' in old and b'earthline-swale-zoom-gate-css' in old
assert b'earthlineTemporaryMapHint126' in old
p.write_bytes(old+addition)
assert p.read_bytes()[:-596]==old
print('M133_EXACT_UPLOADED_596_BYTE_BLOCK_APPLIED',len(old),len(p.read_bytes()))
