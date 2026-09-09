(function(){
  'use strict';
  const BUILD='EARTHLINE-LAB-16601-SHARED-SOURCE-MAPPED-WATER';
  if(window.EARTHLINE_LAB_WATER_16601&&window.EARTHLINE_LAB_WATER_16601.installed)return;

  const base=window.earthlineBuildVectorNoBuildMask;
  const processBase=window.earthlineProcessMappedFeature;
  if(typeof base!=='function'||typeof processBase!=='function'){
    window.EARTHLINE_LAB_WATER_16601={installed:false,error:'shared vector owner/rasterizer unavailable',at:new Date().toISOString()};
    return;
  }

  function stale(gen){try{return typeof earthlineIsStale==='function'&&earthlineIsStale(gen)}catch(_){return false}}
  function propertyRun(){try{const loc=M&&M.loc||{};return !(/Regional Opportunity Tile/i.test(String(loc.name||''))||(Array.isArray(loc.zones)&&loc.zones.includes('Regional Tile')))}catch(_){return false}}
  function portableRun(){try{return !!(M&&M.propertyJurisdiction16516&&M.propertyJurisdiction16516.mode==='portable-non-vermont')}catch(_){return false}}
  function failClosed(reason,detail){
    const c=(typeof M!=='undefined'&&M&&M.vectorNoBuildCoverage)?M.vectorNoBuildCoverage:{};
    c.mappedWater16601=Object.assign({owner:'vectorNoBuild15778',status:'failed',reason,build:BUILD,at:new Date().toISOString()},detail||{});
    c.publicationAllowed=false;c.verified=false;c.exclusionVerified=false;
    try{if(typeof earthlineSetVectorVerification16343==='function')earthlineSetVectorVerification16343(c,'failed',reason)}catch(_){ }
    if(typeof M!=='undefined'&&M)M.vectorNoBuildCoverage=c;
    try{if(typeof EarthlinePrescriptionHalt==='function')throw new EarthlinePrescriptionHalt(reason,{build:BUILD,stage:'mapped-water-mask',detail:detail||{}})}catch(e){if(e&&e.name&&/EarthlinePrescriptionHalt/i.test(String(e.name)))throw e}
    const e=new Error(reason);e.code='EARTHLINE_MAPPED_WATER_UNVERIFIED';throw e;
  }
  function isWaterFeature(f){
    if(!f||!f.geometry)return false;
    const p=f.properties||{},l=f.layer||{};
    const natural=String(p.natural||'').toLowerCase();
    const waterway=String(p.waterway||'').toLowerCase();
    const water=String(p.water||'').toLowerCase();
    const src=String(f.sourceLayer||l['source-layer']||'').toLowerCase();
    const lid=String(l.id||'').toLowerCase();
    if(natural==='water'||natural==='wetland'||waterway==='riverbank'||water)return true;
    if(/^(river|stream|canal|ditch|drain)$/.test(waterway))return true;
    if(/(^|[_-])(water|waterway|river|stream|lake|reservoir|wetland|canal)([_-]|$)/.test(src))return true;
    if(/(^|[_-])(water|river|stream|lake|reservoir|wetland|canal)([_-]|$)/.test(lid)&&!/label|symbol/.test(lid))return true;
    return false;
  }

  async function sharedMappedWater16601(gen){
    const capture=propertyRun()&&portableRun()&&!stale(gen);
    if(!capture)return base(gen);

    const captured=[];
    const originalWindow=window.earthlineProcessMappedFeature;
    const captureFn=function(mask,driveway,feature){
      try{if(feature&&feature.geometry)captured.push(feature)}catch(_){ }
      return processBase.apply(this,arguments);
    };
    window.earthlineProcessMappedFeature=captureFn;
    try{earthlineProcessMappedFeature=captureFn}catch(_){ }

    let result;
    try{result=await base(gen)}finally{
      window.earthlineProcessMappedFeature=originalWindow;
      try{earthlineProcessMappedFeature=originalWindow}catch(_){ }
    }
    if(stale(gen))return false;

    const waterFeatures=captured.filter(isWaterFeature);
    if(!captured.length)return failClosed('shared-source-feature-capture-empty',{capturedFeatures:0});
    if(!waterFeatures.length)return failClosed('shared-source-has-no-mapped-water',{capturedFeatures:captured.length});

    const rawWaterMask=new Uint8Array(N),dummy=new Uint8Array(N);let processed=0;
    for(let i=0;i<waterFeatures.length;i++){
      if(stale(gen))return false;
      processed+=Number(processBase(rawWaterMask,dummy,waterFeatures[i])||0);
      if((i&63)===63){try{if(typeof earthlineTaskYield16464==='function')await earthlineTaskYield16464()}catch(_){ }}
    }
    let waterCells=0;for(let i=0;i<N;i++)if(rawWaterMask[i])waterCells++;
    if(!waterCells)return failClosed('shared-source-mapped-water-rasterized-zero',{capturedFeatures:captured.length,waterFeatures:waterFeatures.length,processedWaterGeometries:processed});

    const merged=(M.vectorNoBuildMask&&M.vectorNoBuildMask.length===N)?new Uint8Array(M.vectorNoBuildMask):new Uint8Array(N);
    let addedCells=0;for(let i=0;i<N;i++)if(rawWaterMask[i]){if(!merged[i])addedCells++;merged[i]=1}
    M.vectorNoBuildMask=merged;M.mappedWaterMask16601=rawWaterMask;
    M.vectorNoBuildStamp=String(M.vectorNoBuildStamp||'')+'|mapped-water-16601:'+waterCells+':'+addedCells;M._noBuildStamp=null;M.noBuildProvenance15843=null;
    const c=M.vectorNoBuildCoverage||{};
    c.mappedWater16601={owner:'vectorNoBuild15778',status:'verified',source:'existing-authoritative-property-source-set',acquisitionResult:'reused-verified-run-source',queryMode:'same-run source feature reuse; no second network owner',capturedFeatures:captured.length,waterFeatures:waterFeatures.length,processedWaterGeometries:processed,waterCells,addedCells,sharedFinalMask:'M.vectorNoBuildMask -> M.noBuildMask',corridorGate:'existing final no-build mask',rechargeGate:'existing final hard-block prefilter/containment gate',build:BUILD,at:new Date().toISOString()};
    M.vectorNoBuildCoverage=c;
    window.EARTHLINE_LAB_WATER_16601={installed:true,lastRun:{gen:Number(gen),capturedFeatures:captured.length,waterFeatures:waterFeatures.length,waterCells,addedCells,at:new Date().toISOString()},build:BUILD};
    return result;
  }

  window.earthlineBuildVectorNoBuildMask=sharedMappedWater16601;
  try{earthlineBuildVectorNoBuildMask=sharedMappedWater16601}catch(_){ }
  window.EARTHLINE_LAB_WATER_16601={installed:true,build:BUILD,at:new Date().toISOString()};
})();
