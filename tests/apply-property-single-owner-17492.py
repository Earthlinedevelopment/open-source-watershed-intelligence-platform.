from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

# 1) Neutralize stacked 17451 control ownership: it now delegates back to the
# authoritative consolidated panel reconciler instead of assigning handlers.
a=s.index("<!-- EARTHLINE_PROPERTY_REPEAT_ONE_PRESS_17451:")
b=s.index("</script>",a)+len("</script>")
block=s[a:b]
old_start="function bind(){"
i=block.index(old_start)
j=block.index("  document.addEventListener('earthline:analysis-complete'",i)
new_bind=r'''function bind(){
    try{
      if(typeof window.earthlineReconcilePanel16188==='function'){
        window.earthlineReconcilePanel16188();
        return true;
      }
    }catch(_){}
    return false;
  }
'''
block2=block[:i]+new_bind+block[j:]
s=s[:a]+block2+s[b:]

# 2) Replace authoritative reconcilePanel Property handlers with one launcher.
start=s.index("  property.onpointerup=function(ev){", s.index("function reconcilePanel16188"))
end=s.index("  };property.querySelector('.el69-dot')?.remove();", start)+4
old=s[start:end]
new=r'''  property.__earthlineLaunch17492=function(ev){
    const now=Date.now(),last=Number(property.dataset.earthlinePointerLaunch17444||0);
    if(ev&&Number(ev.detail||0)!==0&&now-last<1200)return false;
    property.dataset.earthlinePointerLaunch17444=String(now);
    const fn=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof fn!=='function')return false;
    const serialBefore17492=Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0);
    property.dataset.earthlinePressAccepted17492='1';
    document.documentElement.classList.add('earthline-property-orb-latched-16244');
    const launch17492=()=>{
      try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}
      let out17492;
      try{out17492=fn()}catch(_){
        if(Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17492){
          property.dataset.earthlinePressAccepted17492='';
          document.documentElement.classList.remove('earthline-property-orb-latched-16244');
        }
        return;
      }
      Promise.resolve(out17492).then(v17492=>{
        if(v17492===false&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17492){
          property.dataset.earthlinePressAccepted17492='';
          document.documentElement.classList.remove('earthline-property-orb-latched-16244');
        }
      }).catch(()=>{
        if(Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)<=serialBefore17492){
          property.dataset.earthlinePressAccepted17492='';
          document.documentElement.classList.remove('earthline-property-orb-latched-16244');
        }
      });
    };
    if(typeof requestAnimationFrame==='function')requestAnimationFrame(()=>setTimeout(launch17492,0));
    else setTimeout(launch17492,0);
    return false;
  };
  property.onpointerup=function(ev){
    if(ev&&Number.isFinite(Number(ev.button))&&Number(ev.button)!==0)return false;
    return property.__earthlineLaunch17492(ev);
  };
  property.onclick=function(ev){
    const now=Date.now(),last=Number(property.dataset.earthlinePointerLaunch17444||0);
    if(ev&&Number(ev.detail||0)!==0&&now-last<1200){
      ev.preventDefault?.();ev.stopPropagation?.();return false;
    }
    return property.__earthlineLaunch17492(ev);
  };'''
s=s[:start]+new+s[end:]

s="<!-- EARTHLINE_PROPERTY_SINGLE_CONTROL_OWNER_17492: reconcilePanel16188 solely owns first+repeat Property activation; 17451 delegates. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed single Property control owner 17492")
