#!/usr/bin/env python3
"""M136 display-only; append scoped CSS, never change calculations or data."""
from pathlib import Path
import subprocess
p=Path("index.html")
before=p.read_bytes()
assert subprocess.check_output(["git","hash-object","index.html"],text=True).strip()=="151001d83787bb156efdfccc85e20cf697b1ad69"
assert b"#earthlineCorridorTip16248.open{display:block}" in before
assert b"earthlineTemporaryMapHint126" in before
assert b"earthline-legend-home-gate-css" in before
append=b"""
<style id="earthline-m136-regional-layout-only">
/* Regional onboarding never displays two popups simultaneously.
   Existing timer and dismiss behavior remains the owner of the hint. */
body:has(#earthlineTemporaryMapHint126) #earthlineCorridorTip16248.open{
 display:none!important;
}
/* Center both messages over the visible map viewport, not the app/panel. */
#earthlineCorridorTip16248{
 left:calc((100vw + var(--el-rail-16188, 86px) + var(--el-panel-16188, 385px))/2)!important;
 right:auto!important;top:22px!important;
 transform:translateX(-50%)!important;
 width:min(350px,calc(100vw - var(--el-rail-16188, 86px) - var(--el-panel-16188, 385px) - 28px))!important;
 max-width:calc(100vw - 28px)!important;
 box-sizing:border-box!important;
}
#earthlineCorridorTip16248::before{display:none!important}
#earthlineTemporaryMapHint126{
 left:calc((100vw + var(--el-rail-16188, 86px) + var(--el-panel-16188, 385px))/2)!important;
 top:22px!important;transform:translateX(-50%)!important;
 max-width:calc(100vw - 28px)!important;
}
/* Three Regional-only legends form a bottom-left stack above the map scale. */
html[data-earthline-has-results] #earthlineSwaleLegend16050{
 top:auto!important;bottom:224px!important;
 left:calc(var(--el-rail-16188, 86px) + var(--el-panel-16188, 385px) + 22px)!important;
 max-width:min(570px,calc(100vw - var(--el-rail-16188, 86px) - var(--el-panel-16188, 385px) - 38px))!important;
}
html[data-earthline-has-results] #earthlineAquiferLegend16070{
 top:auto!important;bottom:178px!important;
 left:calc(var(--el-rail-16188, 86px) + var(--el-panel-16188, 385px) + 22px)!important;
}
html[data-earthline-has-results] #earthlineDiagramLegend16080{
 top:auto!important;bottom:135px!important;
 left:calc(var(--el-rail-16188, 86px) + var(--el-panel-16188, 385px) + 22px)!important;
}
@media(max-width:760px){
 #earthlineTemporaryMapHint126,#earthlineCorridorTip16248{
   left:50%!important;top:78px!important;
   width:min(350px,calc(100vw - 24px))!important;
   max-width:calc(100vw - 24px)!important;
   transform:translateX(-50%)!important;
 }
 html[data-earthline-has-results] #earthlineSwaleLegend16050{
   left:12px!important;bottom:224px!important;
   max-width:calc(100vw - 24px)!important;flex-wrap:wrap!important;
 }
 html[data-earthline-has-results] #earthlineAquiferLegend16070{
   left:12px!important;bottom:180px!important;
 }
 html[data-earthline-has-results] #earthlineDiagramLegend16080{
   left:12px!important;bottom:137px!important;
 }
}
</style>
"""
assert b"earthline-m136-regional-layout-only" not in before
p.write_bytes(before+append)
assert p.read_bytes()[:-len(append)]==before
print("M136_APPEND_ONLY_CSS",len(append),"bytes")
