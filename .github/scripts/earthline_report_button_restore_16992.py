from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    const processOpen=location.hash==='#earthline-process'; document.documentElement.classList.toggle('earthline-process-open-16991',processOpen);
    const pp=processOpen?ensureEarthlineProcessPage16265():document.getElementById('earthlineProcessPage16265');if(pp){pp.classList.toggle('open',processOpen);pp.setAttribute('aria-hidden',processOpen?'false':'true');}
    return swalesOpen||processOpen;
"""
new="""    const processOpen=location.hash==='#earthline-process'; document.documentElement.classList.toggle('earthline-process-open-16991',processOpen);
    const pp=processOpen?ensureEarthlineProcessPage16265():document.getElementById('earthlineProcessPage16265');if(pp){pp.classList.toggle('open',processOpen);pp.setAttribute('aria-hidden',processOpen?'false':'true');}
    if(!swalesOpen&&!processOpen){
      const report=document.getElementById('earthlineVermontReport16149'),slot=document.getElementById('earthlineReportSlot16188'),section=document.getElementById('earthlineReportSection16188');
      if(section){section.style.removeProperty('display');section.style.removeProperty('visibility');}
      if(report&&slot&&report.parentElement!==slot)slot.appendChild(report);
      if(report){report.style.removeProperty('display');report.style.removeProperty('visibility');}
    }
    return swalesOpen||processOpen;
"""
if old not in s:
    raise SystemExit("16991 process sync token missing")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
