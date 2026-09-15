from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='EARTHLINE 16638 — REGIONAL PRESENTATION HANDOFF BEFORE CAMERA'
if marker in s:
    print('16638 already applied')
    raise SystemExit(0)

old="""      if(isRegional(q,loc))return await runRegional(q,loc,runToken);"""
if s.count(old)!=1:
    raise SystemExit(f'guard failed: expected one Regional dispatch anchor, found {s.count(old)}')

new="""      if(isRegional(q,loc)){
        /* EARTHLINE 16638 — REGIONAL PRESENTATION HANDOFF BEFORE CAMERA.
           Property already hands the existing 15778/15805 presentation owners to
           Property before camera motion (16279). Do the symmetric handoff here for
           Regional before runRegional changes camera/terrain. This prevents a settled
           prior Property from remaining propertyActive during the state transition and
           re-running its texture/presentation work on moveend/idle. Same owners only;
           no new listener, renderer, source, mask, hydrology rule, or lifecycle owner. */
        try{
          const regionalState16638=window.earthlineRegional15778;
          if(regionalState16638){regionalState16638.active=true;regionalState16638.mode='regional';}
          const owner16638=window.earthlineApplyRendererOwnership15805;
          if(typeof owner16638==='function')owner16638('regional');
          const overlay16638=document.getElementById('earthlineRegionalVectorOverlay16020');
          if(overlay16638)overlay16638.style.display='';
        }catch(error16638){console.warn('[Earthline 16638] Regional presentation handoff',error16638)}
        return await runRegional(q,loc,runToken);
      }"""
s=s.replace(old,new,1)

if s.count(marker)!=1:
    raise SystemExit('post-guard failed: 16638 marker count != 1')
if s.count("regionalState16638.active=true;regionalState16638.mode='regional';")!=1:
    raise SystemExit('post-guard failed: Regional handoff state not unique')
p.write_text(s,encoding='utf-8')
print('16638 applied: existing Regional presentation owner now reclaims before camera motion')
