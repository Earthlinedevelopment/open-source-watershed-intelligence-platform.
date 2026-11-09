#!/usr/bin/env python3
from pathlib import Path
import subprocess
p=Path('index.html')
s=p.read_text()
c=subprocess.check_output(['git','show','origin/mantra123-hotfix3-review:index.html'],text=True)
def only(src,term):
 n=src.count(term)
 if n!=1:raise RuntimeError('Expected one occurrence of '+term[:65]+'; found '+str(n))
 return src.index(term)
def between(src,a,b):
 i=only(src,a);j=src.find(b,i+len(a))
 if j<0:raise RuntimeError('Missing end anchor '+b)
 return src[i:j]
def change(a,b):
 global s
 only(s,a);s=s.replace(a,b,1)
helpers=between(c,'  /* Hotfix 3 R9 — best-effort US Census place resolution','  function buildReport(data)')
change('  function buildReport(data)',helpers+'  function buildReport(data)')
aquifer=between(c,'    /* R10: SVG geometry is taken from the verified, bounded report capture only. */','    for(const r of roads)')
change('    for(const r of roads)',aquifer+'    for(const r of roads)')
change('<div class="el49-location">${esc(data.query)}</div><p class="el49-purpose">','<div class="el49-location">${esc(data.query)}</div><div class="el49-location" style="font-size:15px;opacity:.85">${esc(data.placeLine||"Coordinates not resolved")}</div><p class="el49-purpose">')
change('<figure class="el49-figure">${mapSvg(d,false)}<figcaption>','<figure class="el49-figure">${mapSvg(Object.assign({},d,{reportAquifer:data.reportAquifer}),false)}<figcaption>')
change(between(s,'  function openReport(){','  window.earthlineOpenVermontReport16151=openReport;'),between(c,'  async function openReport(){','  window.earthlineOpenVermontReport16151=openReport;'))
hint="""
  /* M126: Requested temporary map instruction; automatically dismiss. */
  let earthlineMapHintShown126=false;
  function earthlineShowMapHint126(){
    if(earthlineMapHintShown126)return;
    earthlineMapHintShown126=true;
    const tip=document.createElement('div');
    tip.id='earthlineTemporaryMapHint126';
    tip.setAttribute('role','status');
    tip.textContent='Place hand cursor over bare land to move map.';
    Object.assign(tip.style,{position:'fixed',bottom:'24px',left:'50%',transform:'translateX(-50%)',maxWidth:'calc(100vw - 32px)',background:'rgba(15,28,36,.94)',color:'#fff',padding:'10px 18px',fontFamily:'Noto Sans,sans-serif',fontSize:'14px',textAlign:'center',borderRadius:'8px',zIndex:'1200',pointerEvents:'none',boxShadow:'0 4px 18px rgba(0,0,0,.25)'});
    document.body.appendChild(tip);
    const dismiss=()=>{tip.remove();document.removeEventListener('pointerdown',dismiss,true);document.removeEventListener('wheel',dismiss,true);document.removeEventListener('earthline:analysis-complete',dismiss,true)};
    document.addEventListener('pointerdown',dismiss,true);
    document.addEventListener('wheel',dismiss,{capture:true,passive:true});
    document.addEventListener('earthline:analysis-complete',dismiss,true);
    setTimeout(dismiss,8500);
  }
"""
change('  function initRealGlobe16233()',hint+'  function initRealGlobe16233()')
start=only(s,'  function initRealGlobe16233()')
end=s.find('function ensureRegionalCorridorTabs',start)
if end<0:raise RuntimeError('initializer boundary not found')
f=s[start:end]
if f.count('return true}')!=1:raise RuntimeError('initializer malformed')
s=s[:start]+f.replace('return true}','earthlineShowMapHint126();return true}',1)+s[end:]
assert s.count('Place hand cursor over bare land to move map.')==1
assert 'reportPlaceLine123(baseData.d)' in s
assert 'reportAquifer:data.reportAquifer' in s
p.write_text(s)
print('M126_PATCHED')
