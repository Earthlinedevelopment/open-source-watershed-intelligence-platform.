from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Repair 1: a new Regional submission must synchronously retire the previous SVG payload
# before the new camera can emit moveend/zoomend events.
old1="""  function clearForSubmission(token,q){
    const m=map();
    earthlineSupersedePropertyForNewSearch16327(token,q);
"""
new1="""  function clearForSubmission(token,q){
    const m=map();
    earthlineSupersedePropertyForNewSearch16327(token,q);
    window.EARTHLINE_REGIONAL_VISUAL_DATA_16020=null;
    try{
      document.getElementById('earthlineRegionalVectorOverlay16020')?.replaceChildren();
      document.getElementById('earthlineRegionalCorridorTabs16323')?.remove();
    }catch(_){}
"""

# Repair 1 continued: camera/style events may render only the current global payload,
# never a retired closure payload from the preceding state.
old2="""  function schedule(){
    if(activeTier16168()==="property")return;
    cancelAnimationFrame(scheduled);scheduled=requestAnimationFrame(()=>render(lastData));
  }
"""
new2="""  function schedule(){
    if(activeTier16168()==="property")return;
    const current16905=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    if(!current16905){
      lastData=null;
      cancelAnimationFrame(scheduled);
      document.getElementById('earthlineRegionalVectorOverlay16020')?.replaceChildren();
      return;
    }
    cancelAnimationFrame(scheduled);scheduled=requestAnimationFrame(()=>render(current16905));
  }
"""
old3="map.on('style.load',()=>{if(lastData)setTimeout(schedule,80);});"
new3="map.on('style.load',()=>{if(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020)setTimeout(schedule,80);});"

# Repair 2: Alaska's registered authoritative statewide extent is wider than the generic
# 18x14-degree Regional transport cap. Preserve its robust state extent while keeping the
# same DEM grid/tile-budget/safety pipeline.
old4="""    if(w>18){const c=(b[0]+b[2])/2;b[0]=c-9;b[2]=c+9;}if(h>14){const c=(b[1]+b[3])/2;b[1]=c-7;b[3]=c+7;}
"""
new4="""    const fullAlaskaExtent16905=locked&&!focusMode&&String(loc&&loc.jurisdictionProfileId16556||'')==='us-ak';
    if(!fullAlaskaExtent16905){if(w>18){const c=(b[0]+b[2])/2;b[0]=c-9;b[2]=c+9;}if(h>14){const c=(b[1]+b[3])/2;b[1]=c-7;b[3]=c+7;}}
"""

for name,old,new in [('submission-clear',old1,new1),('renderer-schedule',old2,new2),('style-load',old3,new3),('alaska-extent',old4,new4)]:
    n=s.count(old)
    if n!=1:
        raise SystemExit(f'{name}: expected exactly 1 occurrence, found {n}')
    s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
print('Mantra 50 repairs applied: stale Regional payload retirement + Alaska full registered extent')
