from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')

def exact(name, old, new):
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{name}: expected exactly 1 source match, found {count}')
    text = text.replace(old, new, 1)

exact(
    'makeSwalesAsync',
    "  function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null){",
    "  async function earthlineCooperativeYield16661(){if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();return new Promise(r=>setTimeout(r,0));}\n  async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null){"
)

exact(
    'eligibleCountAsync',
    """    function jurisdictionEligibleCount16539(list16539){
      if(focusMode||!jurisdictionGeometry16539)return list16539.length;
      let count16539=0;
      for(const candidate16539 of list16539)if(screenJurisdictionCandidate16539(candidate16539))count16539++;
      return count16539;
    }""",
    """    async function jurisdictionEligibleCount16539(list16539){
      if(focusMode||!jurisdictionGeometry16539)return list16539.length;
      let count16539=0,yieldCount16661=0;
      for(const candidate16539 of list16539){if(screenJurisdictionCandidate16539(candidate16539))count16539++;if((++yieldCount16661%12)===0)await earthlineCooperativeYield16661();}
      return count16539;
    }"""
)

exact(
    'eligibleAwait',
    'const preferredEligibleCount16539=jurisdictionEligibleCount16539(candidates);',
    'const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);'
)

exact(
    'finalScreenYield',
    """      const eligible16539=[];
      for(const candidate16539 of candidates){
        const screened16539=screenJurisdictionCandidate16539(candidate16539);
        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;
      }""",
    """      const eligible16539=[];let finalScreenYield16661=0;
      for(const candidate16539 of candidates){
        const screened16539=screenJurisdictionCandidate16539(candidate16539);
        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;
        if((++finalScreenYield16661%12)===0)await earthlineCooperativeYield16661();
      }"""
)

exact(
    'makeSwalesAwait',
    'let swales=makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);',
    'let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);'
)

old_fc = """  function earthlineClipFeatureCollection16539(fc,g){
    const out=[];for(const feature of (fc&&fc.features||[])){if(!feature||!feature.geometry)continue;const geom=feature.geometry,props=Object.assign({},feature.properties||{});if(geom.type==='Point'){if(earthlinePointInJurisdiction16539(geom.coordinates,g))out.push({type:'Feature',properties:props,geometry:JSON.parse(JSON.stringify(geom))});continue;}const lines=geom.type==='LineString'?[geom.coordinates]:geom.type==='MultiLineString'?(geom.coordinates||[]):[];for(const line of lines)for(const run of earthlineClipLine16539(line,g)){const safe=run;if(safe.length>=2)out.push({type:'Feature',properties:Object.assign({},props,{jurisdiction_boundary_screened:true}),geometry:{type:'LineString',coordinates:safe}});}}return {type:'FeatureCollection',features:out};
  }"""
new_fc = """  async function earthlineClipFeatureCollection16539(fc,g){
    const out=[],features16661=(fc&&fc.features||[]);let featureIndex16661=0;
    for(const feature of features16661){
      if(feature&&feature.geometry){
        const geom=feature.geometry,props=Object.assign({},feature.properties||{});
        if(geom.type==='Point'){
          if(earthlinePointInJurisdiction16539(geom.coordinates,g))out.push({type:'Feature',properties:props,geometry:JSON.parse(JSON.stringify(geom))});
        }else{
          const lines=geom.type==='LineString'?[geom.coordinates]:geom.type==='MultiLineString'?(geom.coordinates||[]):[];
          for(const line of lines)for(const run of earthlineClipLine16539(line,g)){const safe=run;if(safe.length>=2)out.push({type:'Feature',properties:Object.assign({},props,{jurisdiction_boundary_screened:true}),geometry:{type:'LineString',coordinates:safe}});}
        }
      }
      if((++featureIndex16661%12)===0)await earthlineCooperativeYield16661();
    }
    return {type:'FeatureCollection',features:out};
  }"""
exact('clipFeatureAsync', old_fc, new_fc)

old_out = """  function earthlineOutsideCoordinateCount16539(fc,g){let outside=0;for(const f of (fc&&fc.features||[])){const geom=f&&f.geometry;if(!geom)continue;if(geom.type==='Point'){if(!earthlinePointInJurisdiction16539(geom.coordinates,g))outside++;continue;}const lines=geom.type==='LineString'?[geom.coordinates]:geom.type==='MultiLineString'?(geom.coordinates||[]):[];for(const line of lines)for(const p of (line||[]))if(earthlineFinitePoint16539(p)&&!earthlinePointInJurisdiction16539(p,g))outside++;}return outside;}"""
new_out = """  async function earthlineOutsideCoordinateCount16539(fc,g){
    let outside=0,featureIndex16661=0;
    for(const f of (fc&&fc.features||[])){
      const geom=f&&f.geometry;
      if(geom){
        if(geom.type==='Point'){if(!earthlinePointInJurisdiction16539(geom.coordinates,g))outside++;}
        else{const lines=geom.type==='LineString'?[geom.coordinates]:geom.type==='MultiLineString'?(geom.coordinates||[]):[];for(const line of lines)for(const p of (line||[]))if(earthlineFinitePoint16539(p)&&!earthlinePointInJurisdiction16539(p,g))outside++;}
      }
      if((++featureIndex16661%16)===0)await earthlineCooperativeYield16661();
    }
    return outside;
  }"""
exact('outsideAsync', old_out, new_out)

old_regional = """  function earthlineClipRegionalProducts16539(payload,boundary){
    const g=boundary&&(boundary.prepared||boundary.geometry);if(!g)throw new Error('administrative boundary geometry unavailable');
    const before={contours:Number(payload.contours&&payload.contours.features&&payload.contours.features.length||0),flows:Number(payload.flows&&payload.flows.features&&payload.flows.features.length||0),swales:Number(payload.swales&&payload.swales.features&&payload.swales.features.length||0)};
    const contours=earthlineClipFeatureCollection16539(payload.contours,g),flows=earthlineClipFeatureCollection16539(payload.flows,g),swales=earthlineRerankRegionalSwales16539(earthlineClipFeatureCollection16539(payload.swales,g));
    const after={contours:contours.features.length,flows:flows.features.length,swales:swales.features.length};
    const outsideAfterClip={contours:earthlineOutsideCoordinateCount16539(contours,g),flows:earthlineOutsideCoordinateCount16539(flows,g),swales:earthlineOutsideCoordinateCount16539(swales,g)};
    if(outsideAfterClip.contours||outsideAfterClip.flows||outsideAfterClip.swales)throw new Error('administrative boundary containment invariant failed');
    const audit={build:'EARTHLINE 16539',runToken:payload.runToken||null,query:String(payload.query||''),placeType:boundary.placeType,capability:boundary.capability,source:boundary.source,sourceTier:boundary.sourceTier,sourceVintage:boundary.sourceVintage||null,before,after,outsideAfterClip,removed:{contours:Math.max(0,before.contours-after.contours),flows:Math.max(0,before.flows-after.flows),swales:Math.max(0,before.swales-after.swales)},rule:'hydrology computed continuously on the full DEM envelope; only published Regional products are clipped to the selected administrative polygon',at:new Date().toISOString()};
    return {contours,flows,swales,audit};
  }"""
new_regional = """  async function earthlineClipRegionalProducts16539(payload,boundary){
    const g=boundary&&(boundary.prepared||boundary.geometry);if(!g)throw new Error('administrative boundary geometry unavailable');
    const before={contours:Number(payload.contours&&payload.contours.features&&payload.contours.features.length||0),flows:Number(payload.flows&&payload.flows.features&&payload.flows.features.length||0),swales:Number(payload.swales&&payload.swales.features&&payload.swales.features.length||0)};
    const contours=await earthlineClipFeatureCollection16539(payload.contours,g);
    const flows=await earthlineClipFeatureCollection16539(payload.flows,g);
    const swales=earthlineRerankRegionalSwales16539(await earthlineClipFeatureCollection16539(payload.swales,g));
    const after={contours:contours.features.length,flows:flows.features.length,swales:swales.features.length};
    const outsideAfterClip={contours:await earthlineOutsideCoordinateCount16539(contours,g),flows:await earthlineOutsideCoordinateCount16539(flows,g),swales:await earthlineOutsideCoordinateCount16539(swales,g)};
    if(outsideAfterClip.contours||outsideAfterClip.flows||outsideAfterClip.swales)throw new Error('administrative boundary containment invariant failed');
    const audit={build:'EARTHLINE 16539',runToken:payload.runToken||null,query:String(payload.query||''),placeType:boundary.placeType,capability:boundary.capability,source:boundary.source,sourceTier:boundary.sourceTier,sourceVintage:boundary.sourceVintage||null,before,after,outsideAfterClip,removed:{contours:Math.max(0,before.contours-after.contours),flows:Math.max(0,before.flows-after.flows),swales:Math.max(0,before.swales-after.swales)},rule:'hydrology computed continuously on the full DEM envelope; only published Regional products are clipped to the selected administrative polygon',at:new Date().toISOString()};
    return {contours,flows,swales,audit};
  }"""
exact('regionalClipAsync', old_regional, new_regional)

exact(
    'regionalClipAwait',
    'const bounded16539=earthlineClipRegionalProducts16539({contours,flows,swales,query:q,runToken},boundary16539);',
    'const bounded16539=await earthlineClipRegionalProducts16539({contours,flows,swales,query:q,runToken},boundary16539);'
)

path.write_text(text, encoding='utf-8')
print('Applied responsive shared Regional screening/clipping batching repair to index.html')
