from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="earthline-report-button-visibility-16993"
if marker not in s:
    css="""
<style id="earthline-report-button-visibility-16993">
html:not(.earthline-process-open-16991):not(.earthline-swales-open-16947) #earthlineReportSection16188{
  display:block!important;
  visibility:visible!important;
}
html:not(.earthline-process-open-16991):not(.earthline-swales-open-16947) #earthlineReportSlot16188{
  display:block!important;
  visibility:visible!important;
}
html:not(.earthline-process-open-16991):not(.earthline-swales-open-16947) #earthlineVermontReport16149{
  display:flex!important;
  visibility:visible!important;
  opacity:1!important;
  pointer-events:auto!important;
}
</style>
<script id="earthline-report-button-restore-16993">
(function(){
  function restore(){
    const processOpen=location.hash==='#earthline-process';
    const swalesOpen=location.hash==='#swales-explained';
    if(processOpen||swalesOpen)return;
    const section=document.getElementById('earthlineReportSection16188');
    const slot=document.getElementById('earthlineReportSlot16188');
    const report=document.getElementById('earthlineVermontReport16149');
    if(section){
      section.style.removeProperty('display');
      section.style.removeProperty('visibility');
    }
    if(slot){
      slot.style.removeProperty('display');
      slot.style.removeProperty('visibility');
    }
    if(report&&slot&&report.parentElement!==slot)slot.appendChild(report);
    if(report){
      report.style.removeProperty('display');
      report.style.removeProperty('visibility');
      report.style.removeProperty('opacity');
      report.style.removeProperty('pointer-events');
    }
  }
  window.addEventListener('hashchange',()=>{restore();setTimeout(restore,50);setTimeout(restore,250);});
  window.addEventListener('popstate',()=>{restore();setTimeout(restore,50);setTimeout(restore,250);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{restore();setTimeout(restore,250);},{once:true});
  else {restore();setTimeout(restore,250);}
  window.EARTHLINE_REPORT_BUTTON_RESTORE_16993=restore;
})();
</script>
"""
    i=s.lower().rfind("</head>")
    if i<0: raise SystemExit("head close missing")
    s=s[:i]+css+s[i:]
p.write_text(s,encoding="utf-8")
