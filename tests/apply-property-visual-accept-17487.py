from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_first=r'''  property.onpointerup=function(ev){
    if(ev&&Number.isFinite(Number(ev.button))&&Number(ev.button)!==0)return false;
    const now=Date.now(),last=Number(property.dataset.earthlinePointerLaunch17444||0);
    if(now-last<900)return false;
    property.dataset.earthlinePointerLaunch17444=String(now);
    const fn=window.earthlineDeclarePropertyAtCrosshair16173;
    return typeof fn==='function'?fn(ev):false;
  };'''
new_first=r'''  property.onpointerup=function(ev){
    if(ev&&Number.isFinite(Number(ev.button))&&Number(ev.button)!==0)return false;
    const now=Date.now(),last=Number(property.dataset.earthlinePointerLaunch17444||0);
    if(now-last<900)return false;
    property.dataset.earthlinePointerLaunch17444=String(now);
    const fn=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof fn!=='function')return false;
    const serialBefore17487=Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0);
    property.disabled=true;property.setAttribute('disabled','');
    property.dataset.earthlinePressAccepted17487='1';
    setTimeout(()=>{try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}},0);
    setTimeout(()=>{
      let out17487;
      try{out17487=fn()}catch(_){
        if(Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17487){
          property.disabled=false;property.removeAttribute('disabled');
        }
        return;
      }
      Promise.resolve(out17487).then(v17487=>{
        if(v17487===false&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17487){
          property.disabled=false;property.removeAttribute('disabled');
        }
      }).catch(()=>{
        if(Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17487){
          property.disabled=false;property.removeAttribute('disabled');
        }
      });
    },0);
    return false;
  };'''
if s.count(old_first)!=1: raise SystemExit(f"first Property pointer anchor {s.count(old_first)}")
s=s.replace(old_first,new_first,1)

old_repeat=r'''    b.onpointerup=function(ev){
      if(ev&&Number.isFinite(Number(ev.button))&&Number(ev.button)!==0)return false;
      const now=Date.now(),last=Number(b.dataset.earthlinePointerLaunch17444||0);
      if(now-last<900)return false;
      b.dataset.earthlinePointerLaunch17444=String(now);
      const fn=window.earthlineDeclarePropertyAtCrosshair16173;
      if(typeof fn!=='function')return false;
      const serialBefore17485=Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0);
      b.disabled=true;b.setAttribute('disabled','');
      document.documentElement.dataset.earthlinePropertyRunState='running';
      let out17485;
      try{out17485=fn(ev)}catch(err17485){
        b.disabled=false;b.removeAttribute('disabled');
        document.documentElement.dataset.earthlinePropertyRunState='idle';
        throw err17485;
      }
      if(out17485===false){
        b.disabled=false;b.removeAttribute('disabled');
        document.documentElement.dataset.earthlinePropertyRunState='idle';
        return false;
      }
      setTimeout(()=>{try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}},0);
      Promise.resolve(out17485).then(v17485=>{
        if(v17485===false&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17485){
          b.disabled=false;b.removeAttribute('disabled');
          document.documentElement.dataset.earthlinePropertyRunState='idle';
        }
      }).catch(()=>{
        if(Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17485){
          b.disabled=false;b.removeAttribute('disabled');
          document.documentElement.dataset.earthlinePropertyRunState='idle';
        }
      });
      return out17485;
    };'''
new_repeat=r'''    b.onpointerup=function(ev){
      if(ev&&Number.isFinite(Number(ev.button))&&Number(ev.button)!==0)return false;
      const now=Date.now(),last=Number(b.dataset.earthlinePointerLaunch17444||0);
      if(now-last<900)return false;
      b.dataset.earthlinePointerLaunch17444=String(now);
      const fn=window.earthlineDeclarePropertyAtCrosshair16173;
      if(typeof fn!=='function')return false;
      const serialBefore17487=Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0);
      b.disabled=true;b.setAttribute('disabled','');
      b.dataset.earthlinePressAccepted17487='1';
      setTimeout(()=>{try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}},0);
      setTimeout(()=>{
        let out17487;
        try{out17487=fn()}catch(_){
          if(Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17487){
            b.disabled=false;b.removeAttribute('disabled');
          }
          return;
        }
        Promise.resolve(out17487).then(v17487=>{
          if(v17487===false&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17487){
            b.disabled=false;b.removeAttribute('disabled');
          }
        }).catch(()=>{
          if(Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17487){
            b.disabled=false;b.removeAttribute('disabled');
          }
        });
      },0);
      return false;
    };'''
if s.count(old_repeat)!=1: raise SystemExit(f"repeat Property pointer anchor {s.count(old_repeat)}")
s=s.replace(old_repeat,new_repeat,1)

s="<!-- EARTHLINE_PROPERTY_VISUAL_ACCEPT_AND_PARALLEL_ELDER_17487: immediate button acknowledgement, governed run-state untouched. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed first+repeat visual acceptance and parallel Elder 17487")
