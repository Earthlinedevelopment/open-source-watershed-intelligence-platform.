(function(){
  'use strict';
  const BUILD='EARTHLINE-LAB-16600-SHARED-MAPPED-WATER-MASK';
  if(window.EARTHLINE_LAB_WATER_16600&&window.EARTHLINE_LAB_WATER_16600.installed)return;

  const base=window.earthlineBuildVectorNoBuildMask;
  if(typeof base!=='function'){
    window.EARTHLINE_LAB_WATER_16600={installed:false,error:'earthlineBuildVectorNoBuildMask unavailable',at:new Date().toISOString()};
    return;
  }

  function liveMap(){
    try{return window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null)||null}catch(_){return window.earthlineMap||null}
  }
  function stale(gen){
    try{return typeof earthlineIsStale==='function'&&earthlineIsStale(gen)}catch(_){return false}
  }
  function propertyRun(){
    try{
      const loc=M&&M.loc||{};
      return !(/Regional Opportunity Tile/i.test(String(loc.name||''))||(Array.isArray(loc.zones)&&loc.zones.includes('Regional Tile')));
    }catch(_){return false}
  }
  function analysisBox(){
    try{
      const p=M&&M.analysisBoundaryLngLat||[];
      if(!Array.isArray(p)||p.length<3)return null;
      return {minLng:Math.min(...p.map(x=>Number(x[0]))),maxLng:Math.max(...p.map(x=>Number(x[0]))),minLat:Math.min(...p.map(x=>Number(x[1]))),maxLat:Math.max(...p.map(x=>Number(x[1])))};
    }catch(_){return null}
  }
  function intersects(bb,tb){
    if(!tb||!bb)return true;
    return !(Number(bb.maxX)<tb.minLng||Number(bb.minX)>tb.maxLng||Number(bb.maxY)<tb.minLat||Number(bb.minY)>tb.maxLat);
  }
  function failClosed(reason,detail){
    const c=(typeof M!=='undefined'&&M&&M.vectorNoBuildCoverage)?M.vectorNoBuildCoverage:{};
    c.mappedWater16600=Object.assign({owner:'vectorNoBuild15778',status:'failed',reason,build:BUILD,at:new Date().toISOString()},detail||{});
    c.publicationAllowed=false;c.verified=false;c.exclusionVerified=false;
    try{if(typeof earthlineSetVectorVerification16343==='function')earthlineSetVectorVerification16343(c,'failed',reason);}catch(_){ }
    if(typeof M!=='undefined'&&M)M.vectorNoBuildCoverage=c;
    try{
      if(typeof EarthlinePrescriptionHalt==='function')throw new EarthlinePrescriptionHalt(reason,{build:BUILD,stage:'mapped-water-mask',detail:detail||{}});
    }catch(e){
      if(e&&e.name&&/EarthlinePrescriptionHalt/i.test(String(e.name)))throw e;
    }
    const e=new Error(reason);e.code='EARTHLINE_MAPPED_WATER_UNVERIFIED';throw e;
  }

  async function mappedWaterPass16600(gen,baseResult){
    if(!propertyRun()||stale(gen))return baseResult;
    const mp=liveMap();
    if(!mp||typeof mp.getStyle!=='function'||typeof mp.querySourceFeatures!=='function'){
      return failClosed('mapped-water-query-capability-unavailable',{mapAvailable:!!mp});
    }
    if(typeof earthlineMappedFeatureClass15862J!=='function'||typeof earthlineProcessMappedFeature!=='function'){
      return failClosed('mapped-water-rasterizer-unavailable',{});
    }

    const style=mp.getStyle()||{};
    const tb=analysisBox();
    const all=[];
    let renderedQueries=0,renderedSuccess=0,sourceQueries=0,sourceSuccess=0,queryErrors=0;

    const waterLayers=(style.layers||[]).filter(l=>{
      const text=(String(l&&l.id||'')+' '+String(l&&l['source-layer']||'')).toLowerCase();
      return /water|river|lake|reservoir|stream|canal|wetland/.test(text)&&(l.type==='line'||l.type==='fill'||l.type==='fill-extrusion');
    });

    if(typeof mp.queryRenderedFeatures==='function'&&waterLayers.length){
      try{
        const canvas=mp.getCanvas&&mp.getCanvas();
        let queryBox=canvas?[[0,0],[canvas.clientWidth,canvas.clientHeight]]:undefined;
        if(tb&&typeof mp.project==='function'&&canvas){
          const pts=(M.analysisBoundaryLngLat||[]).map(p=>mp.project(p));
          if(pts.length){
            const pad=36;
            const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
            queryBox=[[clamp(Math.min(...pts.map(p=>p.x))-pad,0,canvas.clientWidth),clamp(Math.min(...pts.map(p=>p.y))-pad,0,canvas.clientHeight)],[clamp(Math.max(...pts.map(p=>p.x))+pad,0,canvas.clientWidth),clamp(Math.max(...pts.map(p=>p.y))+pad,0,canvas.clientHeight)]];
          }
        }
        renderedQueries++;
        const rows=mp.queryRenderedFeatures(queryBox,{layers:waterLayers.map(l=>l.id)})||[];
        all.push(...rows);renderedSuccess++;
      }catch(_){queryErrors++;}
    }

    const pairs=new Map();
    for(const l of waterLayers){
      if(l&&l.source&&l['source-layer'])pairs.set(String(l.source)+'|'+String(l['source-layer']),{source:l.source,sourceLayer:l['source-layer']});
    }
    for(const [sourceId,sourceDef] of Object.entries(style.sources||{})){
      if(!sourceDef||String(sourceDef.type||'').toLowerCase()!=='vector')continue;
      pairs.set(String(sourceId)+'|water',{source:sourceId,sourceLayer:'water'});
      pairs.set(String(sourceId)+'|waterway',{source:sourceId,sourceLayer:'waterway'});
    }
    for(const pair of pairs.values()){
      if(stale(gen))return false;
      try{
        sourceQueries++;
        const rows=mp.querySourceFeatures(pair.source,{sourceLayer:pair.sourceLayer})||[];
        for(const f of rows)all.push(Object.assign({},f,{sourceLayer:(f&&f.sourceLayer)||pair.sourceLayer}));
        sourceSuccess++;
      }catch(_){queryErrors++;}
    }

    if(renderedSuccess+sourceSuccess===0){
      return failClosed('mapped-water-acquisition-unverified',{renderedQueries,sourceQueries,queryErrors,waterLayerCount:waterLayers.length});
    }

    const seen=new Set(),water=[];
    for(const f of all){
      let info=null;try{info=earthlineMappedFeatureClass15862J(f);}catch(_){ }
      if(!info||info.water!==true||!f||!f.geometry)continue;
      let bb=null;try{bb=typeof featureBBox==='function'?featureBBox(f):null;}catch(_){ }
      if(tb&&!intersects(bb,tb))continue;
      const key=(f.id!=null?String(f.id):'')+'|'+String(f.sourceLayer||'')+'|'+String((f.layer&&f.layer.id)||'')+'|'+(bb?[Number(bb.minX).toFixed(6),Number(bb.minY).toFixed(6),Number(bb.maxX).toFixed(6),Number(bb.maxY).toFixed(6)].join(','):JSON.stringify(f.geometry).slice(0,240));
      if(seen.has(key))continue;seen.add(key);water.push(f);
    }

    const rawWaterMask=new Uint8Array(N),dummy=new Uint8Array(N);
    let processed=0;
    for(let i=0;i<water.length;i++){
      if(stale(gen))return false;
      processed+=Number(earthlineProcessMappedFeature(rawWaterMask,dummy,water[i])||0);
      if((i&63)===63){try{if(typeof earthlineTaskYield16464==='function')await earthlineTaskYield16464();}catch(_){ }}
    }
    const waterMask=(typeof earthlineDilateMask==='function')?earthlineDilateMask(rawWaterMask,Math.max(1,2.5/Math.max(.2,Number(M.cellM||1)))):rawWaterMask;
    const merged=(M.vectorNoBuildMask&&M.vectorNoBuildMask.length===N)?new Uint8Array(M.vectorNoBuildMask):new Uint8Array(N);
    let waterCells=0,addedCells=0;
    for(let i=0;i<N;i++)if(waterMask[i]){waterCells++;if(!merged[i])addedCells++;merged[i]=1;}

    M.vectorNoBuildMask=merged;
    M.vectorNoBuildStamp=String(M.vectorNoBuildStamp||'')+'|mapped-water-16600:'+waterCells+':'+addedCells;
    M._noBuildStamp=null;
    M.noBuildProvenance15843=null;
    const c=M.vectorNoBuildCoverage||{};
    c.mappedWater16600={owner:'vectorNoBuild15778',status:'verified',queryMode:'independent mapped-water pass before final no-build union',waterLayerCount:waterLayers.length,renderedQueries,renderedSuccess,sourceQueries,sourceSuccess,queryErrors,rawFeatures:all.length,waterFeatures:water.length,processedWaterGeometries:processed,waterCells,addedCells,sharedFinalMask:'M.vectorNoBuildMask -> M.noBuildMask',corridorGate:'existing final no-build mask',rechargeGate:'existing earthlineRechargeZoneFitsProperty16326 + target prefilter',build:BUILD,at:new Date().toISOString()};
    M.vectorNoBuildCoverage=c;
    window.EARTHLINE_LAB_WATER_16600={installed:true,lastRun:{gen:Number(gen),waterFeatures:water.length,waterCells,addedCells,sourceSuccess,renderedSuccess,at:new Date().toISOString()},build:BUILD};
    return baseResult;
  }

  async function sharedMappedWater16600(gen){
    const result=await base(gen);
    if(stale(gen))return false;
    return mappedWaterPass16600(gen,result);
  }

  window.earthlineBuildVectorNoBuildMask=sharedMappedWater16600;
  try{earthlineBuildVectorNoBuildMask=sharedMappedWater16600}catch(_){ }
  window.EARTHLINE_LAB_WATER_16600={installed:true,build:BUILD,at:new Date().toISOString()};
})();
