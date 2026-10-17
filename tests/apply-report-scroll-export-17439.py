from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_css=""".el49-modal{position:fixed;inset:0;z-index:6000;background:rgba(2,8,12,.84);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:18px}.el49-modal.open{display:flex}.el49-shell{width:min(1180px,97vw);max-height:94vh;overflow:auto;border:1px solid #36576b;border-radius:20px;background:#e8ece8;color:#102530;box-shadow:0 28px 90px rgba(0,0,0,.58)}"""
new_css=""".el49-modal{position:fixed;inset:0;z-index:6000;background:rgba(2,8,12,.84);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:18px;overflow:hidden}.el49-modal.open{display:flex}.el49-shell{width:min(1180px,97vw);height:min(94vh,calc(100dvh - 36px));max-height:min(94vh,calc(100dvh - 36px));min-height:0;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;touch-action:pan-y;border:1px solid #36576b;border-radius:20px;background:#e8ece8;color:#102530;box-shadow:0 28px 90px rgba(0,0,0,.58)}"""
if s.count(old_css)!=1: raise SystemExit(f"report shell CSS anchor count {s.count(old_css)}")
s=s.replace(old_css,new_css,1)

old_mobile="""@media(max-width:760px){#earthlineVermontReport16149{left:12px;top:430px}.el49-modal{padding:6px}.el49-report{padding:6px}.el49-page{padding:38px 28px 60px;min-height:920px}"""
new_mobile="""@media(max-width:760px){#earthlineVermontReport16149{left:12px;top:430px}.el49-modal{padding:6px;align-items:stretch}.el49-shell{height:calc(100dvh - 12px);max-height:calc(100dvh - 12px);width:100%;border-radius:14px}.el49-report{padding:6px}.el49-page{padding:38px 28px 60px;min-height:920px}"""
if s.count(old_mobile)!=1: raise SystemExit(f"report mobile CSS anchor count {s.count(old_mobile)}")
s=s.replace(old_mobile,new_mobile,1)

old_toolbar="""<div class="el49-toolbar-actions"><button class="el49-tool el49-close" data-action="close" aria-label="Return to map">×</button></div>"""
new_toolbar="""<div class="el49-toolbar-actions"><button class="el49-tool primary" data-action="print">Print / Save PDF</button><button class="el49-tool" data-action="newtab">Open in New Tab</button><button class="el49-tool" data-action="download">Download HTML</button><button class="el49-tool el49-close" data-action="close" aria-label="Return to map">×</button></div>"""
if s.count(old_toolbar)!=1: raise SystemExit(f"report toolbar anchor count {s.count(old_toolbar)}")
s=s.replace(old_toolbar,new_toolbar,1)

old_open="""panel.querySelectorAll('[data-action="close"]').forEach(b=>b.onclick=()=>{panel.classList.remove('open');document.documentElement.classList.remove('earthline-report-open-16966')});document.documentElement.classList.add('earthline-report-open-16966');panel.classList.add('open');window.EARTHLINE_FROZEN_REPORT_SNAPSHOT_16149=data;"""
new_open="""panel.querySelectorAll('[data-action="close"]').forEach(b=>b.onclick=()=>{panel.classList.remove('open');document.documentElement.classList.remove('earthline-report-open-16966')});document.documentElement.classList.add('earthline-report-open-16966');panel.classList.add('open');try{window.EARTHLINE_BIOSWALE_REPORT_TOOLBAR_RESTORE_17008?.ensure?.()}catch(_){}window.EARTHLINE_FROZEN_REPORT_SNAPSHOT_16149=data;"""
if s.count(old_open)!=1: raise SystemExit(f"report open anchor count {s.count(old_open)}")
s=s.replace(old_open,new_open,1)

s="<!-- EARTHLINE_BIOSWALE_REPORT_SCROLL_EXPORT_17439: canonical report owns reliable scroll surface and toolbar actions at open. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched Bioswale Report scroll/export owner 17439")
