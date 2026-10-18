from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old=r'''    b.onpointerup=function(ev){
      if(ev&&Number.isFinite(Number(ev.button))&&Number(ev.button)!==0)return false;
      const now=Date.now(),last=Number(b.dataset.earthlinePointerLaunch17444||0);
      if(now-last<900)return false;
      b.dataset.earthlinePointerLaunch17444=String(now);
      const fn=window.earthlineDeclarePropertyAtCrosshair16173;
      return typeof fn==='function'?fn(ev):false;
    };'''
new=r'''    b.onpointerup=function(ev){
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
if s.count(old)!=1: raise SystemExit(f"repeat pointer owner anchor {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_PROPERTY_IMMEDIATE_ACCEPT_17485: first accepted pointer-up immediately owns run state and starts existing Elder owner. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed immediate Property acceptance + Elder start 17485")
