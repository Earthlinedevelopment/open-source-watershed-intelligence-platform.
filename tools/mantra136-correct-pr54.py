#!/usr/bin/env python3
"""Only modify the M136 style block on draft PR #54. No production changes."""
from pathlib import Path
import subprocess
p=Path("index.html")
s=p.read_text()
assert subprocess.check_output(["git","hash-object","index.html"],text=True).strip()=="d7121dafc873de8a8d503fcae14f5d18c71e4798"
start=s.index('<style id="earthline-m136-regional-layout-only">')
end=s.index('</style>',start)+len('</style>')
block=s[start:end]
assert block.count('var(--el-rail-16188, 86px) + var(--el-panel-16188, 385px)')==5,block.count('var(--el-rail-16188, 86px) + var(--el-panel-16188, 385px)')
block=block.replace('var(--el-rail-16188, 86px) + var(--el-panel-16188, 385px)','var(--el-map-left-m136)')
block=block.replace('var(--el-rail-16188, 86px) - var(--el-panel-16188, 385px) - 28px','var(--el-map-left-m136) - 28px')
block=block.replace('var(--el-rail-16188, 86px) - var(--el-panel-16188, 385px) - 38px','var(--el-map-left-m136) - 38px')
assert 'left:12px!important;bottom:224px!important' in block
assert 'left:12px!important;bottom:180px!important' in block
assert 'left:12px!important;bottom:137px!important' in block
block=block.replace('left:12px!important;bottom:', 'left:calc(var(--el-rail-16188, 54px) + 10px)!important;bottom:')
block=block.replace('/* Regional onboarding never displays two popups simultaneously.', '''/* Open panel contributes only while actually open; mobile retains icon rail. */
:root{--el-map-left-m136:var(--el-rail-16188,86px)}
html.earthline-panel-open-16188{--el-map-left-m136:calc(var(--el-rail-16188,86px) + var(--el-panel-16188,385px))}
@media(max-width:760px){:root,html.earthline-panel-open-16188{--el-map-left-m136:var(--el-rail-16188,54px)}}
/* Regional onboarding never displays two popups simultaneously.''')
# Existing legend stack is absolute; constrain wrapping without altering scientific map.
block=block.replace('max-width:calc(100vw - 24px)!important;flex-wrap:wrap!important;', 'max-width:calc(100vw - var(--el-rail-16188,54px) - 20px)!important;flex-wrap:nowrap!important;')
block=block.replace('html[data-earthline-has-results] #earthlineAquiferLegend16070{', 'html[data-earthline-has-results] #earthlineAquiferLegend16070{')
out=s[:start]+block+s[end:]
assert out[:start]==s[:start] and out[start+len(block):]==s[end:]
assert out.count('<style id="earthline-m136-regional-layout-only">')==1
p.write_text(out)
print('M136_PANEL_AND_PHONE_CORRECTION_ONLY',len(s),len(out))
