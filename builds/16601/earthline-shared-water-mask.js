(function(){
  'use strict';
  const BUILD='EARTHLINE-LAB-16601-SHARED-VECTOR-WATER';
  if(window.EARTHLINE_LAB_WATER_16601&&window.EARTHLINE_LAB_WATER_16601.installed)return;

  const base=window.earthlineBuildVectorNoBuildMask;
  if(typeof base!=='function'){
    window.EARTHLINE_LAB_WATER_16601={installed:false,error:'earthlineBuildVectorNoBuildMask unavailable',at:new Date().toISOString()};
    return;
  }

  function liveMap(){try{return window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null)||null}catch(_){return window.earthlineMap||null}}
  function stale(gen){try{return typeof earthlineIsStale==='function'&&earthlineIsStale(gen)}catch(_){return false}}
  function propertyRun(){try{const loc=M&&M.loc||{};return !(/Regional Opportunity Tile/i.test(String(loc.name||''))||(Array.isArray(loc.zones)&&loc.zones.includes('Regional Tile')))}catch(_){return false}}
  function portableRun(){try{return !!(M&&M.propertyJurisdiction16516&&M.propertyJurisdiction16516.mode==='portable-non-vermont')}catch(_){return false}}
  function analysisBox(){try{const p=M&&M.analysisBoundaryLngLat||[];if(!Array.isArray(p)||p.length<3)return null;return {minLng:Math.min(...p.map(x=>Number(x[0]))),maxLng:Math.max(...p.map(x=>Number(x[0]))),minLat:Math.min(...p.map(x=>Number(x[1]))),maxLat:Math.max(...p.map(x=>Number(x[1])))}}catch(_){return null}}
  function intersects(bb,tb){if(!tb||!bb)return true;return !(Number(bb.maxX)<tb.minLng||Number(bb.minX)>tb.maxLng||Number(bb.maxY)<tb.minLat||Number(bb.minY)>tb.maxLat)}
  function failClosed(reason,detail){
    const c=(typeof M!=='undefined'&&M&&M.vectorNoBuildCoverage)?M.vectorNoBuildCoverage:{};
    c.mappedWater16601=Object.assign({owner:'vectorNoBuild15778',status:'failed',reason,build:BUILD,at:new Date().toISOString()},detail||{});
    c.publicationAllowed=false;c.verified=false;c.exclusionVerified=false;
    try{if(typeof earthlineSetVectorVerification16343==='function')earthlineSetVectorVerification16343(c,'failed',reason)}catch(_){ }
    if(typeof M!=='undefined'&&M)M.vectorNoBuildCoverage=c;
    try{if(typeof EarthlinePrescriptionHalt==='function')throw new EarthlinePrescriptionHalt(reason,{build:BUILD,stage:'mapped-water-mask',detail:detail||{}})}catch(e){if(e&&e.name&&/EarthlinePrescriptionHalt/i.test(String(e.name)))throw e}
    const e=new Error(reason);e.code='EARTHLINE_MAPPED_WATER_UNVERIFIED';throw e;
  }

  async function mappedWaterPass16601(gen,baseResult){
    if(!propertyRun()||!portableRun()||stale(gen))return baseResult;
    const mp=liveMap();
    if(!mp||typeof mp.getStyle!=='function'||typeof mp.querySourceFeatures!=='function')return failClosed('mapped-water-query-capability-unavailable',{mapAvailable:!!mp});
    if(typeof earthlineMappedFeatureClass15862J!=='function'||typeof earthlineProcessMappedFeature!=='function')return failClosed('mapped-water-rasterizer-unavailable',{});

    const style=mp.getStyle()||{},tb=analysisBox(),all=[];
    const pairs=[];
    for(const [sourceId,sourceDef] of Object.entries(style.sources||{})){
      if(!sourceDef||String(sourceDef.type||'').toLowerCase()!=='vector')continue;
      pairs.push({source:sourceId,sourceLayer:'water'},{source:sourceId,sourceLayer:'waterway'});
    }
    let sourceQueries=0,sourceSuccess=0,queryErrors=0;
    for(const pair of pairs){
      if(stale(gen))return false;
      try{
        sourceQueries++;
        const rows=mp.querySourceFeatures(pair.source,{sourceLayer:pair.sourceLayer})||[];
        for(const f of rows)all.push(Object.assign({},f,{sourceLayer:(f&&f.sourceLayer)||pair.sourceLayer}));
        sourceSuccess++;
      }catch(_){queryErrors++;}
    }
    if(sourceSuccess===0)return failClosed('mapped-water-source-query-unverified',{sourceQueries,queryErrors,vectorSourceCount:pairs.length/2});

    const seen=new Set(),water=[];
    for(const f of all){
      let info=null;try{info=earthlineMappedFeatureClass15862J(f)}catch(_){ }
      if(!info||info.water!==true||!f||!f.geometry)continue;
      let bb=null;try{bb=typeof featureBBox==='function'?featureBBox(f):null}catch(_){ }
      if(tb&&!intersects(bb,tb))continue;
      const key=(f.id!=null?String(f.id):'')+'|'+String(f.sourceLayer||'')+'|'+(bb?[Number(bb.minX).toFixed(6),Number(bb.minY).toFixed(6),Number(bb.maxX).toFixed(6),Number(bb.maxY).toFixed(6)].join(','):JSON.stringify(f.geometry).slice(0,240));
      if(seen.has(key))continue;seen.add(key);water.push(f);
    }

    const rawWaterMask=new Uint8Array(N),dummy=new Uint8Array(N);let processed=0;
    for(let i=0;i<water.length;i++){
      if(stale(gen))return false;
      processed+=Number(earthlineProcessMappedFeature(rawWaterMask,dummy,water[i])||0);
      if((i&63)===63){try{if(typeof earthlineTaskYield16464==='function')await earthlineTaskYield16464()}catch(_){ }}
    }
    const waterMask=(typeof earthlineDilateMask==='function')?earthlineDilateMask(rawWaterMask,Math.max(1,2.5/Math.max(.2,Number(M.cellM||1)))):rawWaterMask;
    const merged=(M.vectorNoBuildMask&&M.vectorNoBuildMask.length===N)?new Uint8Array(M.vectorNoBuildMask):new Uint8Array(N);
    let waterCells=0,addedCells=0;
    for(let i=0;i<N;i++)if(waterMask[i]){waterCells++;if(!merged[i])addedCells++;merged[i]=1}

    M.vectorNoBuildMask=merged;M.mappedWaterMask16601=waterMask;
    M.vectorNoBuildStamp=String(M.vectorNoBuildStamp||'')+'|mapped-water-16601:'+waterCells+':'+addedCells;M._noBuildStamp=null;M.noBuildProvenance15843=null;
    const c=M.vectorNoBuildCoverage||{};
    c.mappedWater16601={owner:'vectorNoBuild15778',status:'verified',source:'loaded-authoritative-vector-source',acquisitionResult:'verified-source-query',queryMode:'same loaded vector source; no second network owner',vectorSourceCount:pairs.length/2,sourceQueries,sourceSuccess,queryErrors,rawFeatures:all.length,waterFeatures:water.length,processedWaterGeometries:processed,waterCells,addedCells,sharedFinalMask:'M.vectorNoBuildMask -> M.noBuildMask',corridorGate:'existing final no-build mask',rechargeGate:'existing final hard-block prefilter/containment gate',build:BUILD,at:new Date().toISOString()};
    M.vectorNoBuildCoverage=c;
    window.EARTHLINE_LAB_WATER_16601={installed:true,lastRun:{gen:Number(gen),rawFeatures:all.length,waterFeatures:water.length,waterCells,addedCells,sourceSuccess,at:new Date().toISOString()},build:BUILD};
    return baseResult;
  }

  async function sharedMappedWater16601(gen){
    const result=await base(gen);if(stale(gen))return false;return mappedWaterPass16601(gen,result);
  }

  window.earthlineBuildVectorNoBuildMask=sharedMappedWater16601;
  try{earthlineBuildVectorNoBuildMask=sharedMappedWater16601}catch(_){ }
  window.EARTHLINE_LAB_WATER_16601={installed:true,build:BUILD,at:new Date().toISOString()};
})();
