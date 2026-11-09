#!/usr/bin/env python3
"""One narrowly scoped UI repair: move temporary Regional hint clear of map scale;
give it an accessible close button, preserve the 20s timeout."""
from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
start=s.index("  let earthlineMapHintShown126=false;")
end=s.index("  /* M126: show the instruction only AFTER",start)
old=s[start:end]
assert old.count("function earthlineShowMapHint126()")==1
assert "Place hand cursor over bare land to move map." in old
assert "setTimeout(dismiss,20000);" in old
new="""  let earthlineMapHintShown126=false;
  function earthlineShowMapHint126(){
    if(earthlineMapHintShown126)return;
    earthlineMapHintShown126=true;
    const tip=document.createElement('aside');
    tip.id='earthlineTemporaryMapHint126';
    tip.setAttribute('role','status');
    tip.setAttribute('aria-label','Map navigation tip');
    Object.assign(tip.style,{
      position:'fixed',top:'96px',left:'50%',bottom:'auto',
      transform:'translateX(-50%)',width:'max-content',
      maxWidth:'min(420px,calc(100vw - 32px))',
      display:'flex',gap:'12px',alignItems:'center',
      background:'rgba(15,28,36,.97)',color:'#fff',
      padding:'10px 12px 10px 16px',
      fontFamily:'Noto Sans,sans-serif',fontSize:'14px',
      textAlign:'left',borderRadius:'9px',
      zIndex:'2200',pointerEvents:'auto',
      boxShadow:'0 4px 18px rgba(0,0,0,.3)'
    });
    const text=document.createElement('span');
    text.textContent='Place hand cursor over bare land to move map.';
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
    tip.append(text,close);
    document.body.appendChild(tip);
    let timer=null;
    const dismiss=()=>{if(timer!==null)clearTimeout(timer);tip.remove()};
    close.addEventListener('click',dismiss,{once:true});
    timer=setTimeout(dismiss,20000);
  }
"""
s=s[:start]+new+s[end:]
assert s.count("Place hand cursor over bare land to move map.")==1
assert s.count("setTimeout(dismiss,20000);")==1
assert s.count("reportPlaceLine123(baseData.d)")==1
assert s.count("reportAquiferContext123(baseData.d)")==1
assert s.count("earthlineShowMapHint126();")==1
p.write_text(s,encoding="utf-8")
print("DISMISSIBLE_HINT_PATCHED")
