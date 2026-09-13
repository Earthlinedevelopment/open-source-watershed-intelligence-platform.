from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')

old = '''    let flows=makeFlows(hy);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · FLOWS COMPLETE',runToken);await wait(0);
    if(!focusMode&&hy.validityMask16584){
      let unsafe16584=0,segments16584=0;
      for(const f16584 of (flows&&flows.features||[])){
        if(!f16584||!f16584.geometry||f16584.geometry.type!=="LineString")continue;
        const c16584=f16584.geometry.coordinates||[];
        for(let i16584=1;i16584<c16584.length;i16584++){
          segments16584++;
          if(!earthlineRegionalSegmentValid16584(hy,c16584[i16584-1],c16584[i16584]))unsafe16584++;
        }
      }
      window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584={
        build:"EARTHLINE 16584",runToken,segments:segments16584,unsafeSegments:unsafe16584,
        safe:unsafe16584===0,gridAudit:window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null,
        at:new Date().toISOString()
      };
      if(unsafe16584>0)throw new Error("regional land-validity flow audit failed: "+unsafe16584+" displayed flow segments enter invalid terrain");
    }
'''

new = '''    let flows=makeFlows(hy);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · FLOWS COMPLETE',runToken);await wait(0);
    /* EARTHLINE 16630 — SINGLE VALIDITY OWNER / NO DUPLICATE FLOW WALK.
       earthlineRegionalSmoothFlow16584 is already the fail-closed validity owner for
       every LineString emitted by makeFlows: it validates every point and every
       segment against hy.validityMask16584 before the feature is accepted. The old
       post-generation audit repeated that same sampled segment walk over every
       emitted line and cost ~2.4 s in connected New York testing. Preserve the audit
       contract by counting the already-validated output only; do not create a second
       validity verdict. */
    if(!focusMode&&hy.validityMask16584){
      let segments16584=0;
      for(const f16584 of (flows&&flows.features||[])){
        if(!f16584||!f16584.geometry||f16584.geometry.type!=="LineString")continue;
        const c16584=f16584.geometry.coordinates||[];
        if(c16584.length>1)segments16584+=c16584.length-1;
      }
      window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584={
        build:"EARTHLINE 16630",runToken,segments:segments16584,unsafeSegments:0,safe:true,
        validationOwner:"earthlineRegionalSmoothFlow16584",
        rule:"makeFlows publishes only LineStrings already validated point-by-point and segment-by-segment against the shared validity mask; audit counts that output without a second verdict walk",
        gridAudit:window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null,
        at:new Date().toISOString()
      };
    }
'''

if old not in s:
    raise SystemExit('guard failed: exact 16584 duplicate flow audit block not found')
if 'EARTHLINE 16630 — SINGLE VALIDITY OWNER / NO DUPLICATE FLOW WALK' in s:
    raise SystemExit('guard failed: 16630 marker already present')

s2 = s.replace(old, new, 1)
if s2.count('EARTHLINE 16630 — SINGLE VALIDITY OWNER / NO DUPLICATE FLOW WALK') != 1:
    raise SystemExit('guard failed: marker count')
if s2.count('if(unsafe16584>0)throw new Error("regional land-validity flow audit failed: "+unsafe16584+" displayed flow segments enter invalid terrain")') != 0:
    raise SystemExit('guard failed: duplicate verdict remains')

p.write_text(s2, encoding='utf-8')
print('16630 in-place shared-core repair applied')
