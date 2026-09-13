from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='EARTHLINE 16629 — FINAL WATER MASK PRESERVES VALID FLOW ARROWS'
if marker in s:
    raise SystemExit('guard failed: 16629 marker already present')
if 'EARTHLINE 16628 — FINAL MAPPED-WATER MASK OWNS REGIONAL FLOWS' not in s:
    raise SystemExit('guard failed: 16628 final flow mask missing')

old=r'''      const safeFlowFeatures16628=[];
      let inputSegments16628=0,rejectedSegments16628=0,outputSegments16628=0;
      for(const flow16628 of flows.features){
        if(!flow16628||!flow16628.geometry||flow16628.geometry.type!=='LineString')continue;
        const coords16628=flow16628.geometry.coordinates||[];
        if(coords16628.length<2)continue;
        let run16628=[];'''

new=r'''      const safeFlowFeatures16628=[];
      let inputSegments16628=0,rejectedSegments16628=0,outputSegments16628=0,inputArrows16629=0,rejectedArrows16629=0,outputArrows16629=0;
      /* EARTHLINE 16629 — FINAL WATER MASK PRESERVES VALID FLOW ARROWS.
         16628 correctly filters LineString water paths against the final shared mask.
         Preserve the existing direction-arrow Point features only when their point is
         valid in that same mask; invalid arrows are removed with the water crossing. */
      for(const flow16628 of flows.features){
        if(!flow16628||!flow16628.geometry)continue;
        if(flow16628.geometry.type==='Point'&&flow16628.properties&&flow16628.properties.feature_type==='flow-arrow'){
          inputArrows16629++;
          if(earthlineRegionalPointValid16584(hy,flow16628.geometry.coordinates)){
            safeFlowFeatures16628.push(flow16628);outputArrows16629++;
          }else rejectedArrows16629++;
          continue;
        }
        if(flow16628.geometry.type!=='LineString')continue;
        const coords16628=flow16628.geometry.coordinates||[];
        if(coords16628.length<2)continue;
        let run16628=[];'''

if s.count(old)!=1:
    raise SystemExit(f'guard failed: 16628 filter loop count {s.count(old)}')
s=s.replace(old,new,1)

old_audit=r'''        rejectedSegments:rejectedSegments16628,outputSegments:outputSegments16628,
        sharedFinalMask:true,safe:true,at:new Date().toISOString()'''
new_audit=r'''        rejectedSegments:rejectedSegments16628,outputSegments:outputSegments16628,
        inputArrows:inputArrows16629,rejectedArrows:rejectedArrows16629,outputArrows:outputArrows16629,
        sharedFinalMask:true,safe:true,at:new Date().toISOString()'''
if s.count(old_audit)!=1:
    raise SystemExit(f'guard failed: 16628 audit tail count {s.count(old_audit)}')
s=s.replace(old_audit,new_audit,1)

p.write_text(s,encoding='utf-8')
print('16629 patch applied')
