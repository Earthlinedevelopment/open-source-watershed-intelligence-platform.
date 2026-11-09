#!/usr/bin/env python3
"""Move M126 map instruction from initial globe to the first published Regional run."""
from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
needle='earthlineShowMapHint126();return true}'
assert s.count(needle)==1, ('home hint anchor',s.count(needle))
s=s.replace(needle,'return true}',1)
old="    document.addEventListener('earthline:analysis-complete',dismiss,true);"
assert s.count(old)==1
s=s.replace(old,"    /* Do not immediately dismiss the requested message on analysis completion. */",1)
target="    setTimeout(dismiss,8500);"
assert s.count(target)==1
s=s.replace(target,"    setTimeout(dismiss,20000);",1)
anchor='  function initRealGlobe16233()'
assert s.count(anchor)==1
reg=r"""
  /* M126: show the instruction only AFTER the first successful Regional publication.
     The home map cannot consume the one-time hint. */
  (function setupRegionalMapHint126(){
    let completed=false;
    function regionalPublished126(){
      const d=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||
        window.EARTHLINE_DISPLAYED_RUN_16151||
        window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const tier=String(d?.tier||d?.mode||document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase();
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
      const published=/screening published|regional analysis complete|regional screening published/i.test(status);
      return !!d && tier!=='property' && tier!=='focus' && (published||!!window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970);
    }
    function showWhenRegional126(event){
      if(completed||earthlineMapHintShown126)return;
      const mode=String(event?.detail?.tier||event?.detail?.mode||'').toLowerCase();
      if(mode&&mode!=='regional')return;
      if(!regionalPublished126())return;
      completed=true;
      earthlineShowMapHint126();
      window.EARTHLINE_MAP_HINT_AUDIT_126={trigger:'regional-published',shown:true,at:new Date().toISOString()};
    }
    document.addEventListener('earthline:analysis-complete',showWhenRegional126);
    /* Status/run polling handles Regional engines that do not emit the DOM event. */
    const interval=setInterval(()=>{
      if(completed||earthlineMapHintShown126){clearInterval(interval);return;}
      showWhenRegional126();
    },500);
    window.addEventListener('pagehide',()=>clearInterval(interval),{once:true});
  })();
"""
s=s.replace(anchor,reg+anchor,1)
assert s.count('earthlineShowMapHint126();')==1
assert s.count("Place hand cursor over bare land to move map.")==1
assert 'reportPlaceLine123(baseData.d)' in s
p.write_text(s,encoding='utf-8')
print('M126_REGIONAL_HINT_FIXED')
