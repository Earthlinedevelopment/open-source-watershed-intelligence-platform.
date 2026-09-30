from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Mantra 50 Task 1 — state-to-state Regional transition cleanup.
# The first repair retired the final SVG payload, but the ranked Regional Mapbox
# sources are separate owners. Empty every existing Regional presentation source
# synchronously before camera movement so a prior state cannot flash in the next.
needle="""    window.EARTHLINE_REGIONAL_VISUAL_DATA_16020=null;
    try{
      document.getElementById('earthlineRegionalVectorOverlay16020')?.replaceChildren();
      document.getElementById('earthlineRegionalCorridorTabs16323')?.remove();
    }catch(_){}

    /* EARTHLINE 16334 — remove Property-only presentation before Regional camera
"""
replacement="""    window.EARTHLINE_REGIONAL_VISUAL_DATA_16020=null;
    try{
      document.getElementById('earthlineRegionalVectorOverlay16020')?.replaceChildren();
      document.getElementById('earthlineRegionalCorridorTabs16323')?.remove();
    }catch(_){}
    /* EARTHLINE 16905 — retire every existing Regional map presentation owner before
       state-to-state camera movement. This changes presentation lifecycle only; no
       hydrology, ranking, geometry, exclusions, or publication science is changed. */
    try{
      const empty16905={type:'FeatureCollection',features:[]};
      for(const sourceId16905 of [
        'earthline-ranked-swale-opportunities-15775',
        'earthline-regional-flow-15761',
        'earthline-regional-grades-15772',
        'earthline-regional-contours-15772',
        'earthline-regional-coverage-15761',
        'earthline-swales',
        'earthline-recharge-zones'
      ]){
        const src16905=m&&m.getSource&&m.getSource(sourceId16905);
        if(src16905&&typeof src16905.setData==='function')src16905.setData(empty16905);
      }
      window.EARTHLINE_REGIONAL_TRANSITION_CLEAR_AUDIT_16905={
        build:'EARTHLINE 16905',runToken:token||null,query:String(q||''),
        regionalPresentationCleared:true,at:new Date().toISOString()
      };
    }catch(error){
      recordRun('regional_transition_clear_warning_16905',token,{error:String(error&&error.message||error)});
    }

    /* EARTHLINE 16334 — remove Property-only presentation before Regional camera
"""

if 'EARTHLINE_REGIONAL_TRANSITION_CLEAR_AUDIT_16905' in s:
    print('Mantra 50 Regional transition source cleanup already present')
else:
    n=s.count(needle)
    if n!=1:
        raise SystemExit(f'regional-source-clear: expected exactly 1 occurrence, found {n}')
    s=s.replace(needle,replacement,1)
    p.write_text(s,encoding='utf-8')
    print('Mantra 50 repair applied: all existing Regional presentation sources retired before camera movement')
