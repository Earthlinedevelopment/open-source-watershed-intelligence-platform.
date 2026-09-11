from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='EARTHLINE 16609 — U.S. LAUNCH CORE REPAIR'
if marker in s:
    raise SystemExit('guard failed: 16609 product marker already present')

old_swales="""    const acceptedChosen=focusMode?auditedCandidates.filter(c=>c.contourAudit16166.valid):auditedCandidates;"""
new_swales="""    /* EARTHLINE 16609 — U.S. LAUNCH CORE REPAIR: final Regional contour geometry
       must remain on the already-authoritative 16584 land/water validity mask after smoothing. */
    let regionalLandWaterRejected16609=0;
    const acceptedChosen=focusMode?auditedCandidates.filter(c=>c.contourAudit16166.valid):auditedCandidates.filter(c=>{
      const segment16609=c&&c.segment||[];
      if(segment16609.length<2){regionalLandWaterRejected16609++;return false;}
      for(let i16609=1;i16609<segment16609.length;i16609++){
        if(!earthlineRegionalSegmentValid16584(hy,segment16609[i16609-1],segment16609[i16609])){regionalLandWaterRejected16609++;return false;}
      }
      return true;
    });"""
if s.count(old_swales)!=1:
    raise SystemExit(f'guard failed: makeSwales anchor count {s.count(old_swales)}')
s=s.replace(old_swales,new_swales,1)

old_audit="""      focusContourGateEnforced:!!focusMode,focusContourGateRejected:chosen.length-acceptedChosen.length,"""
new_audit="""      focusContourGateEnforced:!!focusMode,focusContourGateRejected:focusMode?chosen.length-acceptedChosen.length:0,
      regionalLandWaterGateRejected:focusMode?0:regionalLandWaterRejected16609,"""
if s.count(old_audit)!=1:
    raise SystemExit(f'guard failed: swale audit anchor count {s.count(old_audit)}')
s=s.replace(old_audit,new_audit,1)

old_land="""      if(landValidity16584&&landValidity16584.acquisitionResult===\"features-found\"){
        validityGrid16584=earthlineLandValidityMask16584(dem,landValidity16584);
        if(validityGrid16584&&validityGrid16584.mask&&Number(validityGrid16584.audit&&validityGrid16584.audit.validLandCellCount||0)>0){
          hy=await hydrology(dem,validityGrid16584.mask);
        }else{
          landValidity16584.acquisitionResult=\"unavailable\";
          landValidity16584.failureReason=\"land-validity produced zero valid land cells\";
          window.EARTHLINE_LAND_VALIDITY_16584=landValidity16584;
          validityGrid16584=null;
          hy=await hydrology(dem,null);
        }
      }else{
        hy=await hydrology(dem,null);
      }"""
new_land="""      const usStateRun16609=!!(profile16549&&loc&&String(loc.countryCode||'').toLowerCase()==='us'&&loc.jurisdictionProfileId16556);
      if(landValidity16584&&landValidity16584.acquisitionResult===\"features-found\"){
        validityGrid16584=earthlineLandValidityMask16584(dem,landValidity16584);
        let validLand16609=Number(validityGrid16584&&validityGrid16584.audit&&validityGrid16584.audit.validLandCellCount||0);
        /* Sparse/disconnected states (notably island and very large states) need enough
           samples to preserve actual land on the same authoritative statewide extent.
           The terrain tiles are already cached; only the grid is resampled. */
        if(usStateRun16609&&validLand16609<32){
          const sparseStarted16609=performance.now();
          dem=await loadDEM(b,240,240,6500,'open sparse-state elevation');
          if(!isCurrentRun(runToken))return false;
          validityGrid16584=earthlineLandValidityMask16584(dem,landValidity16584);
          validLand16609=Number(validityGrid16584&&validityGrid16584.audit&&validityGrid16584.audit.validLandCellCount||0);
          window.EARTHLINE_US_STATE_SPARSE_GRID_AUDIT_16609={build:'EARTHLINE 16609',runToken,query:q,retried:true,grid:[dem.w,dem.h],validLandCellCount:validLand16609,elapsedMs:Math.round(performance.now()-sparseStarted16609),at:new Date().toISOString()};
        }else if(usStateRun16609){
          window.EARTHLINE_US_STATE_SPARSE_GRID_AUDIT_16609={build:'EARTHLINE 16609',runToken,query:q,retried:false,grid:[dem.w,dem.h],validLandCellCount:validLand16609,elapsedMs:0,at:new Date().toISOString()};
        }
        if(validityGrid16584&&validityGrid16584.mask&&validLand16609>0){
          hy=await hydrology(dem,validityGrid16584.mask);
        }else if(usStateRun16609){
          throw new Error('U.S. state land-validity produced zero valid land cells after adaptive sampling; unsafe ocean fallback blocked');
        }else{
          landValidity16584.acquisitionResult=\"unavailable\";
          landValidity16584.failureReason=\"land-validity produced zero valid land cells\";
          window.EARTHLINE_LAND_VALIDITY_16584=landValidity16584;
          validityGrid16584=null;
          hy=await hydrology(dem,null);
        }
      }else if(usStateRun16609){
        throw new Error('U.S. state land-validity source unavailable; unverified Regional science was not published');
      }else{
        hy=await hydrology(dem,null);
      }"""
if s.count(old_land)!=1:
    raise SystemExit(f'guard failed: land-validity anchor count {s.count(old_land)}')
s=s.replace(old_land,new_land,1)

run_anchor="""  async function runRegional(q,loc,runToken){"""
helper="""  function earthlineMappedWaterSwaleGate16609(map16609,swales16609,runToken16609){
    const before16609=Number(swales16609&&swales16609.features&&swales16609.features.length||0),polys16609=[],lines16609=[];
    let sourceQueries16609=0,sourceSuccess16609=0,rawFeatures16609=0;
    const finite16609=p=>Array.isArray(p)&&Number.isFinite(Number(p[0]))&&Number.isFinite(Number(p[1]));
    const bbox16609=ring=>{let w=Infinity,s=Infinity,e=-Infinity,n=-Infinity;for(const p of ring||[]){if(!finite16609(p))continue;w=Math.min(w,+p[0]);s=Math.min(s,+p[1]);e=Math.max(e,+p[0]);n=Math.max(n,+p[1]);}return Number.isFinite(w)?[w,s,e,n]:null;};
    const ringInside16609=(p,r)=>{let inside=false;for(let i=0,j=(r||[]).length-1;i<(r||[]).length;j=i++){const a=r[i],b=r[j];if(!finite16609(a)||!finite16609(b))continue;const hit=((b[1]>p[1])!==(a[1]>p[1]))&&(p[0]<(a[0]-b[0])*(p[1]-b[1])/((a[1]-b[1])||1e-15)+b[0]);if(hit)inside=!inside;}return inside;};
    const polyInside16609=(p,rings)=>{if(!rings||!rings.length||!ringInside16609(p,rings[0]))return false;for(let i=1;i<rings.length;i++)if(ringInside16609(p,rings[i]))return false;return true;};
    const orient16609=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    const onSeg16609=(a,b,p)=>Math.min(a[0],b[0])-1e-10<=p[0]&&p[0]<=Math.max(a[0],b[0])+1e-10&&Math.min(a[1],b[1])-1e-10<=p[1]&&p[1]<=Math.max(a[1],b[1])+1e-10;
    const segInter16609=(a,b,c,d)=>{const o1=orient16609(a,b,c),o2=orient16609(a,b,d),o3=orient16609(c,d,a),o4=orient16609(c,d,b),eps=1e-12;if(Math.abs(o1)<eps&&onSeg16609(a,b,c))return true;if(Math.abs(o2)<eps&&onSeg16609(a,b,d))return true;if(Math.abs(o3)<eps&&onSeg16609(c,d,a))return true;if(Math.abs(o4)<eps&&onSeg16609(c,d,b))return true;return (o1>0)!==(o2>0)&&(o3>0)!==(o4>0);};
    const addGeometry16609=g=>{
      if(!g)return;
      const polys=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?(g.coordinates||[]):[];
      for(const rings of polys){if(!Array.isArray(rings)||!rings.length)continue;const bb=bbox16609(rings[0]);if(bb)polys16609.push({rings,bbox:bb});}
      const ls=g.type==='LineString'?[g.coordinates]:g.type==='MultiLineString'?(g.coordinates||[]):[];
      for(const c of ls){if(Array.isArray(c)&&c.length>1)lines16609.push(c);}
    };
    try{
      const style16609=map16609&&map16609.getStyle&&map16609.getStyle();
      const layers16609=Array.isArray(style16609&&style16609.layers)?style16609.layers:[];
      const targets16609=[];
      for(const layer16609 of layers16609){const sl16609=String(layer16609&&layer16609['source-layer']||'').toLowerCase();if((sl16609==='water'||sl16609==='waterway')&&layer16609.source)targets16609.push([String(layer16609.source),sl16609]);}
      const seen16609=new Set();
      for(const [sid16609,sl16609] of targets16609){const key16609=sid16609+'|'+sl16609;if(seen16609.has(key16609))continue;seen16609.add(key16609);sourceQueries16609++;try{const rows16609=map16609.querySourceFeatures(sid16609,{sourceLayer:sl16609})||[];sourceSuccess16609++;rawFeatures16609+=rows16609.length;for(const f16609 of rows16609)addGeometry16609(f16609&&f16609.geometry);}catch(_){} }
    }catch(_){}
    const segmentHits16609=(a,b)=>{
      const sb=[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])];
      for(const p of polys16609){const bb=p.bbox;if(sb[2]<bb[0]||sb[0]>bb[2]||sb[3]<bb[1]||sb[1]>bb[3])continue;if(polyInside16609(a,p.rings)||polyInside16609(b,p.rings))return true;for(const r of p.rings||[])for(let i=1;i<r.length;i++)if(segInter16609(a,b,r[i-1],r[i]))return true;}
      for(const line of lines16609)for(let i=1;i<line.length;i++)if(finite16609(line[i-1])&&finite16609(line[i])&&segInter16609(a,b,line[i-1],line[i]))return true;
      return false;
    };
    const safe16609=[];let rejected16609=0;
    for(const f16609 of (swales16609&&swales16609.features||[])){
      const c16609=f16609&&f16609.geometry&&f16609.geometry.type==='LineString'?f16609.geometry.coordinates:[];let bad16609=false;
      for(let i16609=1;i16609<c16609.length&&!bad16609;i16609++)if(segmentHits16609(c16609[i16609-1],c16609[i16609]))bad16609=true;
      if(bad16609)rejected16609++;else safe16609.push(f16609);
    }
    const verified16609=sourceQueries16609>0&&sourceSuccess16609>0;
    const out16609=earthlineRerankRegionalSwales16539({type:'FeatureCollection',features:safe16609});
    window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609={build:'EARTHLINE 16609',runToken:runToken16609,sourceQueries:sourceQueries16609,sourceSuccess:sourceSuccess16609,rawWaterFeatures:rawFeatures16609,waterPolygonParts:polys16609.length,waterwayLines:lines16609.length,before:before16609,after:out16609.features.length,rejected:rejected16609,verified:verified16609,safe:true,at:new Date().toISOString()};
    return {swales:out16609,verified:verified16609,audit:window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609};
  }

"""+run_anchor
if s.count(run_anchor)!=1:
    raise SystemExit(f'guard failed: runRegional anchor count {s.count(run_anchor)}')
s=s.replace(run_anchor,helper,1)

preflight_anchor="""    /* EARTHLINE 16329 — core preflight occurs before any final Regional display
       publication. A failed run cannot leave a visually convincing partial result. */"""
water_gate="""    /* EARTHLINE 16609 — wait for the already-started authoritative camera settle so
       loaded vector water/waterway features cover the sampled extent, then fail closed
       for U.S. states if that existing map evidence cannot be verified. */
    await cameraSettle16310;
    if(!isCurrentRun(runToken))return false;
    if(!focusMode){
      const mappedWaterGate16609=earthlineMappedWaterSwaleGate16609(m,swales,runToken);
      const usStateWaterRun16609=!!(profile16549&&loc&&String(loc.countryCode||'').toLowerCase()==='us'&&loc.jurisdictionProfileId16556);
      if(usStateWaterRun16609&&mappedWaterGate16609.verified!==true)throw new Error('U.S. state mapped-water verification unavailable; unverified swales were not published');
      swales=mappedWaterGate16609.swales;
    }

"""+preflight_anchor
if s.count(preflight_anchor)!=1:
    raise SystemExit(f'guard failed: preflight anchor count {s.count(preflight_anchor)}')
s=s.replace(preflight_anchor,water_gate,1)

if marker not in s:
    raise SystemExit('guard failed: product marker missing after patch')
p.write_text(s,encoding='utf-8')
