from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE_REPORT_BUTTON_RESTORE_16992"
if marker not in s:
    needle="    return swalesOpen||processOpen;"
    if needle not in s:
        raise SystemExit("process sync return not found")
    inject="""    // EARTHLINE_REPORT_BUTTON_RESTORE_16992
    if(!swalesOpen&&!processOpen){
      const report=document.getElementById('earthlineVermontReport16149');
      const slot=document.getElementById('earthlineReportSlot16188');
      const section=document.getElementById('earthlineReportSection16188');
      if(section){section.style.removeProperty('display');section.style.removeProperty('visibility');}
      if(report&&slot&&report.parentElement!==slot)slot.appendChild(report);
      if(report){report.style.removeProperty('display');report.style.removeProperty('visibility');}
    }
"""
    s=s.replace(needle,inject+needle,1)
p.write_text(s,encoding="utf-8")
