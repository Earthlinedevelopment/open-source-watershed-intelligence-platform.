from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    /* I/O-only warm at the exact current target; no presentation/state mutation. */
    try{void window.EARTHLINE_ELDER_TREES_V1_17097?.prefetchPropertyTarget?.()}catch(_){}

    const launch17494=()=>{
      try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}
      let out17494;
      try{out17494=fn()}catch(_){
        if(Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17494){
          b.dataset.earthlinePressAccepted17494='';
          document.documentElement.classList.remove('earthline-property-orb-latched-16244');
        }
        return;
      }
      Promise.resolve(out17494).then(v17494=>{
        if(v17494===false&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17494){
          b.dataset.earthlinePressAccepted17494='';
          document.documentElement.classList.remove('earthline-property-orb-latched-16244');
        }
      }).catch(()=>{
        if(Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17494){
          b.dataset.earthlinePressAccepted17494='';
          document.documentElement.classList.remove('earthline-property-orb-latched-16244');
        }
      });
    };
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>setTimeout(launch17494,0));
    else setTimeout(launch17494,0);
    return false;"""
new="""    /* EARTHLINE 17497 — launch the governed Property owner and the existing
       Elder owner immediately on the accepted physical press. Do not route core
       execution through requestAnimationFrame; background-tab throttling can delay
       rAF by many seconds. The synthesized click remains deduped above. */
    try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}
    let out17497;
    try{out17497=fn()}catch(_){
      if(Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17494){
        b.dataset.earthlinePressAccepted17494='';
        document.documentElement.classList.remove('earthline-property-orb-latched-16244');
      }
      return false;
    }
    Promise.resolve(out17497).then(v17497=>{
      if(v17497===false&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17494){
        b.dataset.earthlinePressAccepted17494='';
        document.documentElement.classList.remove('earthline-property-orb-latched-16244');
      }
    }).catch(()=>{
      if(Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17494){
        b.dataset.earthlinePressAccepted17494='';
        document.documentElement.classList.remove('earthline-property-orb-latched-16244');
      }
    });
    return false;"""
if s.count(old)!=1: raise SystemExit(f"17494 launch anchor {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_PROPERTY_IMMEDIATE_EXECUTION_17497: no rAF/timer between accepted press and governed Property/Elder launch. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed immediate governed Property/Elder execution 17497")
