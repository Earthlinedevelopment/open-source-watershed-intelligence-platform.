from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old=r'''    /* I/O-only warm at the exact current target; no presentation/state mutation. */
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
    };'''
new=r'''    const launch17494=()=>{
      let out17494;
      try{out17494=fn()}catch(_){
        if(Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17494){
          b.dataset.earthlinePressAccepted17494='';
          document.documentElement.classList.remove('earthline-property-orb-latched-16244');
        }
        return;
      }
      if(out17494!==false){
        /* EARTHLINE 17495 — governed Property declaration updates the current
           20-acre boundary synchronously. Start Elder only after that update so
           repeat searches cannot compute the previous parcel first. */
        setTimeout(()=>{
          try{void window.EARTHLINE_ELDER_TREES_V1_17097?.prefetchPropertyTarget?.()}catch(_){}
          try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}
        },0);
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
    };'''
if s.count(old)!=1: raise SystemExit(f"17494 Elder-order anchor {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_ELDER_AFTER_PROPERTY_BOUNDARY_17495: start exact-target Elder only after governed Property declaration updates boundary. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed Elder after Property boundary 17495")
