#!/usr/bin/env python3
"""M137: Hide exactly three legacy legend boxes; reinstate native 20s
map-moving hint on later Regional publications, without touching engines."""
from pathlib import Path
import subprocess
p=Path('index.html')
s=p.read_bytes()
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()=='e0172573bb2bd8385fad4f8dcef1ca3d1d63a00d'
assert subprocess.check_output(['git','hash-object','index.html'],text=True).strip()=='2d407f5a1c78d01d778b27ba84fa13d2eeac4f20'
assert b'earthlineShowMapHint126' in s and b'earthlineTemporaryMapHint126' in s
assert b'earthlineSwaleLegend16050' in s and b'earthlineAquiferLegend16070' in s and b'earthlineDiagramLegend16080' in s
assert b'mantra137-legacy-box-removal' not in s
extra=r'''
<style id="mantra137-legacy-box-removal">
/* Visual-only removal. Keep scientific overlay rendering and accessibility
   unchanged; retire these three old floating controls on every map mode. */
#earthlineSwaleLegend16050,
#earthlineAquiferLegend16070,
#earthlineDiagramLegend16080{display:none!important}
</style>
<script id="mantra137-map-moving-tip-return">
/* M126 already provides the approved 20-second ×-dismissible map tip on the
   first Regional publication. Repeat only when another Regional run completes,
   never stacking copies or showing one on Property/home. */
(function(){
  let lastRunToken=null;
  let managedTimer=null;
  function closeCurrent(){
    if(managedTimer!==null){clearTimeout(managedTimer);managedTimer=null;}
    document.getElementById('earthlineTemporaryMapHint126')?.remove();
  }
  document.addEventListener('earthline:analysis-complete',function(event){
    const tier=String(event?.detail?.tier||event?.detail?.mode||'').toLowerCase();
    if(tier==='property'){closeCurrent();return;}
    if(tier!=='regional')return;
    const token=String(event?.detail?.runToken||'');
    if(token&&token===lastRunToken)return;
    lastRunToken=token||null;
    if(document.getElementById('earthlineTemporaryMapHint126'))return;
    if(managedTimer!==null){clearTimeout(managedTimer);managedTimer=null;}
    const box=document.createElement('aside');
    box.id='earthlineTemporaryMapHint126';
    box.setAttribute('role','status');
    box.setAttribute('aria-label','Map navigation tip');
    Object.assign(box.style,{
      position:'fixed',top:'96px',left:'50%',bottom:'auto',
      transform:'translateX(-50%)',width:'max-content',
      maxWidth:'min(420px,calc(100vw - 32px))',
      display:'flex',gap:'12px',alignItems:'center',
      background:'rgba(15,28,36,.97)',color:'#fff',
      padding:'10px 12px 10px 16px',
      fontFamily:'Noto Sans,sans-serif',fontSize:'14px',
      textAlign:'left',borderRadius:'9px',
      zIndex:'2147483647',pointerEvents:'auto',
      boxShadow:'0 4px 18px rgba(0,0,0,.3)'
    });
    const message=document.createElement('span');
    message.textContent='Place hand cursor over bare land to move map.';
    const close=document.createElement('button');
    close.type='button';
    close.setAttribute('aria-label','Dismiss map tip');
    close.textContent='×';
    Object.assign(close.style,{
      display:'inline-flex',alignItems:'center',justifyContent:'center',
      flex:'0 0 28px',width:'28px',height:'28px',
      background:'rgba(255,255,255,.16)',color:'#fff',
      border:'1px solid rgba(255,255,255,.45)',borderRadius:'5px',
      cursor:'pointer',fontSize:'22px',lineHeight:'1'
    });
    close.addEventListener('click',closeCurrent,{once:true});
    box.append(message,close);document.body.appendChild(box);
    managedTimer=setTimeout(closeCurrent,20000);
  },{passive:true});
})();
</script>
'''.encode()
p.write_bytes(s+extra)
assert p.read_bytes()[:-len(extra)]==s
print('M137_APPEND_ONLY',len(extra),'bytes; source',len(s))
