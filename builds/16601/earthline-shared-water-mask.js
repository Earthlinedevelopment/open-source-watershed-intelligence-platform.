(function(){
  'use strict';
  const BUILD='EARTHLINE-LAB-16601-SHARED-VECTOR-WATER';
  if(window.EARTHLINE_LAB_WATER_16601&&window.EARTHLINE_LAB_WATER_16601.installed)return;

  const base=window.earthlineBuildVectorNoBuildMask;
  if(typeof base!=='function'){
    window.EARTHLINE_LAB_WATER_16601={installed:false,error:'earthlineBuildVectorNoBuildMask unavailable',at:new Date().toISOString()};
    return;
  }

  /* 16601 prerequisite repair — the shared Property owner asks the official Vermont
     boundary service whether every Property frame is in Vermont before it can assign
     portable-non-vermont jurisdiction. A transport/CORS failure previously blocked
     even frames that are geographically well outside Vermont. Preserve the official
     validator as authority anywhere a frame could plausibly overlap Vermont; only a
     frame wholly outside this deliberately expanded Vermont envelope may continue as
     outside-vermont when that official transport is unavailable. This does not treat
     a failed source as negative boundary evidence inside/near Vermont. */
  const baseVermontBoundaryValidate16601=window.earthlineValidateVermontBoundary16178;
  function whollyOutsideExpandedVermontEnvelope16601(points){
    const rows=(points||[]).filter(p=>Array.isArray(p)&&Number.isFinite(Number(p[0]))&&Number.isFinite(Number(p[1])));
    if(rows.length<3)return false;
    const minLng=Math.min(...rows.map(p=>Number(p[0]))),maxLng=Math.max(...rows.map(p=>Number(p[0]))),minLat=Math.min(...rows.map(p=>Number(p[1]))),maxLat=Math.max(...rows.map(p=>Number(p[1])));
    const vt={minLng:-73.50,maxLng:-71.35,minLat:42.65,maxLat:45.10};
    return maxLng<vt.minLng||minLng>vt.maxLng||maxLat<vt.minLat||minLat>vt.maxLat;
  }
  if(typeof baseVermontBoundaryValidate16601==='function'){
    const portableBoundaryValidate16601=async function(points,options={}){
      const verdict=await baseVermontBoundaryValidate16601(points,options);
      if(verdict&&verdict.reason==='state-boundary-unavailable'&&whollyOutsideExpandedVermontEnvelope16601(points)){
        return {ok:false,context:String(options.context||verdict.context||'analysis'),reason:'outside-vermont',pointsChecked:Array.isArray(points)?points.length:0,insideCount:0,service:verdict.service||null,message:'OUTSIDE VERMONT — frame is wholly outside the conservative Vermont envelope; portable Property analysis may continue while the official Vermont boundary transport is unavailable.',officialBoundaryTransport:'unavailable',officialBoundaryVerified:false,portableEnvelope16601:true,build:BUILD};
      }
      return verdict;
    };
    window.earthlineValidateVermontBoundary16178=portableBoundaryValidate16601;
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
        for(const f of rows){
          const sourceLayer=String((f&&f.sourceLayer)||pair.sourceLayer||'');
          all.push(Object.assign({},f,{sourceLayer,layer:Object.assign({},(f&&f.layer)||{}, {'source-layer':sourceLayer})}));
        }
        sourceSuccess++;
      }catch(_){queryErrors++;}
    }
    if(sourceSuccess===0)return failClosed('mapped-water-source-query-unverified',{sourceQueries,queryErrors,vectorSourceCount:pairs.length/2});

    const seen=new Set(),water=[];
    for(const f of all){
      const sourceLayer=String((f&&(f.sourceLayer||(f.layer&&f.layer['source-layer'])))||'').toLowerCase();
      const sourceLayerWater=sourceLayer==='water'||sourceLayer==='waterway';
      let info=null;try{info=earthlineMappedFeatureClass15862J(f)}catch(_){ }
      if((!sourceLayerWater&&(!info||info.water!==true))||!f||!f.geometry)continue;
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
