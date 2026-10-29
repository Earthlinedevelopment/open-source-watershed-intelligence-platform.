from pathlib import Path
p=Path("index.html");s=p.read_text(encoding="utf-8")
old="@media(max-height:500px) and (orientation:landscape){#earthlinePanel16188{top:6px!important;bottom:6px!important;height:auto!important;border-radius:0 12px 12px 0!important}#earthlinePanelBody16188{padding-bottom:12px!important}}"
new="@media(max-height:500px) and (orientation:landscape){:root{--el-rail-16188:54px;--el-panel-16188:min(385px,calc(100vw - 54px))}#earthlinePanel16188{top:6px!important;bottom:6px!important;height:auto!important;border-radius:0 12px 12px 0!important}#earthlinePanelBody16188{padding-bottom:12px!important}}"
if old not in s: raise SystemExit("landscape media owner not found")
s=s.replace(old,new,1);p.write_text(s,encoding="utf-8");print(len(s))
