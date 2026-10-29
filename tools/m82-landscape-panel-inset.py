from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
needle="@media(max-width:760px){:root{--el-rail-16188:54px;--el-panel-16188:min(330px,calc(100vw - 54px))}#earthlinePanelBrand16201 .mantra-primary{font-size:23px!important}.main,html.earthline-panel-open-16188 .main{left:var(--el-rail-16188)!important}#earthlinePanel16188{width:calc(100vw - var(--el-rail-16188))}#earthlineCorridorTip16248{left:calc(var(--el-rail-16188) + 10px);right:10px;top:118px;width:auto}}"
insert=needle+"\n@media(max-height:500px) and (orientation:landscape){#earthlinePanel16188{top:6px!important;bottom:6px!important;height:auto!important;border-radius:0 12px 12px 0!important}#earthlinePanelBody16188{padding-bottom:12px!important}}"
if insert in s: raise SystemExit("already patched")
if needle not in s: raise SystemExit("mobile panel media owner not found")
s=s.replace(needle,insert,1)
p.write_text(s,encoding="utf-8")
print("patched landscape panel inset",len(s))
