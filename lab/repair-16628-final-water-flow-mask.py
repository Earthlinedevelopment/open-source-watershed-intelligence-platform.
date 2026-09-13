from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='EARTHLINE 16628 — FINAL MAPPED-WATER MASK OWNS REGIONAL FLOWS'
if marker in s:
    raise SystemExit('guard failed: 16628 marker already present')
if 'EARTHLINE 16625 — SHARED REGIONAL MAPPED-WATER FINAL MASK' not in s:
    raise SystemExit('guard failed: 16625 shared mapped-water mask missing')
if 'EARTHLINE 16627 — FAST EQUIVALENT REGIONAL VALIDITY WALK' not in s:
    raise SystemExit('guard failed: 16627 Regional validity owner missing')

old="""      swales=mappedWaterGate16609.swales;
    }
    /* 16625: calculate Regional recharge only after the shared final water mask is frozen. */
    regionalRecharge16492=regionalRechargeModel16492(hy,loc);"""

new=r'''      swales=mappedWaterGate16609.swales;
    }
    /* EARTHLINE 16628 — FINAL MAPPED-WATER MASK OWNS REGIONAL FLOWS.
       16625 freezes mapped-water into hy.validityMask16584 only after the first
       Regional flow collection has already been derived. Enforce that same final,
       shared fail-closed mask on the existing flow collection before publication.
       Invalid crossings are removed while contiguous on-land portions are retained.
       No state-specific branch, source, renderer, lifecycle owner, or science rule. */
    if(!focusMode&&hy&&hy.validityMask16584&&flows&&Array.isArray(flows.features)){
      const safeFlowFeatures16628=[];
      let inputSegments16628=0,rejectedSegments16628=0,outputSegments16628=0;
      for(const flow16628 of flows.features){
        if(!flow16628||!flow16628.geometry||flow16628.geometry.type!=='LineString')continue;
        const coords16628=flow16628.geometry.coordinates||[];
        if(coords16628.length<2)continue;
        let run16628=[];
        const flush16628=()=>{
          if(run16628.length>=2){
            safeFlowFeatures16628.push({...flow16628,geometry:{...flow16628.geometry,coordinates:run16628.slice()}});
            outputSegments16628+=run16628.length-1;
          }
          run16628=[];
        };
        for(let i16628=1;i16628<coords16628.length;i16628++){
          const a16628=coords16628[i16628-1],b16628=coords16628[i16628];
          inputSegments16628++;
          if(earthlineRegionalSegmentValid16584(hy,a16628,b16628)){
            if(!run16628.length)run16628.push(a16628);
            run16628.push(b16628);
          }else{
            rejectedSegments16628++;
            flush16628();
          }
        }
        flush16628();
      }
      flows={...flows,features:safeFlowFeatures16628};
      window.EARTHLINE_FINAL_MAPPED_WATER_FLOW_AUDIT_16628={
        build:'EARTHLINE 16628',runToken,inputSegments:inputSegments16628,
        rejectedSegments:rejectedSegments16628,outputSegments:outputSegments16628,
        sharedFinalMask:true,safe:true,at:new Date().toISOString()
      };
    }
    /* 16625: calculate Regional recharge only after the shared final water mask is frozen. */
    regionalRecharge16492=regionalRechargeModel16492(hy,loc);'''

if s.count(old)!=1:
    raise SystemExit(f'guard failed: post-water final-mask insertion point count {s.count(old)}')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('16628 patch applied')
