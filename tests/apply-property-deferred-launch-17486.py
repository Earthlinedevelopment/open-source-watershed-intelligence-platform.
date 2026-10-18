from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old=r'''    b.onpointerup=function(ev){
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
new=r'''    b.onpointerup=function(ev){
      if(ev&&Number.isFinite(Number(ev.button))&&Number(ev.button)!==0)return false;
      const now=Date.now(),last=Number(b.dataset.earthlinePointerLaunch17444||0);
      if(now-last<900)return false;
      b.dataset.earthlinePointerLaunch17444=String(now);
      const fn=window.earthlineDeclarePropertyAtCrosshair16173;
      if(typeof fn!=='function')return false;
      const serialBefore17486=Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0);
      b.disabled=true;b.setAttribute('disabled','');
      document.documentElement.dataset.earthlinePropertyRunState='running';
      /* EARTHLINE 17486 — finish the physical pointer task immediately.
         Existing Elder and governed Property owners begin on the next event-loop
         turn so the browser can paint the accepted/running state before heavy work. */
      setTimeout(()=>{
        try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}
        let out17486;
        try{out17486=fn()}catch(_){
          if(Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17486){
            b.disabled=false;b.removeAttribute('disabled');
            document.documentElement.dataset.earthlinePropertyRunState='idle';
          }
          return;
        }
        Promise.resolve(out17486).then(v17486=>{
          if(v17486===false&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17486){
            b.disabled=false;b.removeAttribute('disabled');
            document.documentElement.dataset.earthlinePropertyRunState='idle';
          }
        }).catch(()=>{
          if(Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17486){
            b.disabled=false;b.removeAttribute('disabled');
            document.documentElement.dataset.earthlinePropertyRunState='idle';
          }
        });
      },0);
      return false;
    };'''
if s.count(old)!=1: raise SystemExit(f"17485 pointer owner anchor {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_PROPERTY_DEFERRED_GOVERNED_LAUNCH_17486: paint accepted state before Elder + Property compute. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed deferred governed Property launch 17486")
