from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE M82 — SHARED MAPPED-WATER CONTINUITY OWNER"
if marker in s:
    raise SystemExit("already installed")
insert=r'''
<script id="earthline-m82-shared-mapped-water-continuity">
/* EARTHLINE M82 — SHARED MAPPED-WATER CONTINUITY OWNER
   Restores the proven 16601 explicit water/waterway source handoff to the current
   shared-evidence Property pipeline. No slope, spacing, ranking, buffer, recharge,
   or swale prescription thresholds change. Loaded mapped water is rasterized into
   the same vector no-build mask already consumed by Property swales and recharge. */
(function(){
  'use strict';
  const BUILD='EARTHLINE M82 SHARED MAPPED WATER';
  if(window.EARTHLINE_M82_MAPPED_WATER&&window.EARTHLINE_M82_MAPPED_WATER.installed)return;
  const base=window.earthlineBuildVectorNoBuildMask;
  if(typeof base!=='function'){
    window.EARTHLINE_M82_MAPPED_WATER={installed:false,error:'earthlineBuildVectorNoBuildMask unavailable',at:new Date().toISOString()};
    return;
  }
  function liveMap(){try{return window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null)||null}catch(_){return window.earthlineMap||null}}
  function stale(gen){try{return typeof earthlineIsStale==='function'&&earthlineIsStale(gen)}catch(_){return false}}
  function propertyRun(){
    try{
      const loc=M&&M.loc||{};
      return !(/Regional Opportunity Tile/i.test(String(loc.name||''))||(Array.isArray(loc.zones)&&loc.zones.includes('Regional Tile')));
    }catch(_){return false}
  }
  async function addMappedWater(gen,baseResult){
    if(!propertyRun()||stale(gen))return baseResult;
    const mp=liveMap();
    if(!mp||typeof mp.getStyle!=='function'||typeof mp.querySourceFeatures!=='function'||typeof earthlineProcessMappedFeature!=='function')return baseResult;
    const style=mp.getStyle()||{},all=[],pairs=[];
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
          all.push({
            type:(f&&f.type)||'Feature',
            id:f&&f.id,
            source:(f&&f.source)||pair.source,
            sourceLayer,
            geometry:f&&f.geometry,
            properties:(f&&f.properties)||{},
            state:(f&&f.state)||{},
            layer:Object.assign({},(f&&f.layer)||{}, {'source-layer':sourceLayer})
          });
        }
        sourceSuccess++;
      }catch(_){queryErrors++;}
    }
    const seen=new Set(),water=[];
    let sourceLayerWaterCandidates=0,geometryCandidates=0;
    for(const f of all){
      const sourceLayer=String((f&&(f.sourceLayer||(f.layer&&f.layer['source-layer'])))||'').toLowerCase();
      const sourceLayerWater=sourceLayer==='water'||sourceLayer==='waterway';
      if(sourceLayerWater)sourceLayerWaterCandidates++;
      let info=null;try{info=earthlineMappedFeatureClass15862J(f)}catch(_){}
      if(!sourceLayerWater&&(!info||info.water!==true))continue;
      if(!f||!f.geometry)continue;
      geometryCandidates++;
      let bb=null;try{bb=typeof featureBBox==='function'?featureBBox(f):null}catch(_){}
      const key=(f.id!=null?String(f.id):'')+'|'+sourceLayer+'|'+(bb?[Number(bb.minX).toFixed(6),Number(bb.minY).toFixed(6),Number(bb.maxX).toFixed(6),Number(bb.maxY).toFixed(6)].join(','):JSON.stringify(f.geometry).slice(0,240));
      if(seen.has(key))continue;seen.add(key);water.push(f);
      if(water.length>=1200)break;
    }
    const rawWaterMask=new Uint8Array(N),dummy=new Uint8Array(N);let processed=0;
    for(let i=0;i<water.length;i++){
      if(stale(gen))return false;
      processed+=Number(earthlineProcessMappedFeature(rawWaterMask,dummy,water[i])||0);
      if((i&63)===63){try{if(typeof earthlineTaskYield16464==='function')await earthlineTaskYield16464()}catch(_){}}
    }
    let rawWaterCells=0;for(let i=0;i<N;i++)if(rawWaterMask[i])rawWaterCells++;
    const waterMask=(typeof earthlineDilateMask==='function')?earthlineDilateMask(rawWaterMask,Math.max(1,2.5/Math.max(.2,Number(M.cellM||1)))):rawWaterMask;
    const merged=(M.vectorNoBuildMask&&M.vectorNoBuildMask.length===N)?new Uint8Array(M.vectorNoBuildMask):new Uint8Array(N);
    let waterCells=0,addedCells=0;
    for(let i=0;i<N;i++)if(waterMask[i]){waterCells++;if(!merged[i])addedCells++;merged[i]=1}
    M.vectorNoBuildMask=merged;
    M.mappedWaterMaskM82=waterMask;
    M.vectorNoBuildStamp=String(M.vectorNoBuildStamp||'')+'|mapped-water-m82:'+waterCells+':'+addedCells;
    M._noBuildStamp='';
    M.noBuildProvenance15843=null;
    const cov=M.vectorNoBuildCoverage||{};
    cov.mappedWaterM82={
      owner:'earthlineBuildVectorNoBuildMask',
      status:sourceSuccess>0?'screened':'unavailable',
      source:'loaded-vector-source-explicit-water-waterway',
      sourceQueries,sourceSuccess,queryErrors,rawFeatures:all.length,
      sourceLayerWaterCandidates,geometryCandidates,waterFeatures:water.length,
      processedWaterGeometries:processed,rawWaterCells,waterCells,addedCells,
      sharedFinalMask:'M.vectorNoBuildMask -> M.noBuildMask',
      corridorGate:'existing final no-build mask',
      rechargeGate:'existing final hard-block containment gate',
      build:BUILD,at:new Date().toISOString()
    };
    cov.sourceFeatureCount=Number(cov.sourceFeatureCount||0)+water.length;
    cov.relevantFeatureCount=Number(cov.relevantFeatureCount||0)+water.length;
    M.vectorNoBuildCoverage=cov;
    window.EARTHLINE_M82_MAPPED_WATER={installed:true,lastRun:cov.mappedWaterM82,build:BUILD,at:new Date().toISOString()};
    return baseResult;
  }
  async function sharedMappedWater(gen){
    const result=await base(gen);
    if(stale(gen))return false;
    return addMappedWater(gen,result);
  }
  window.earthlineBuildVectorNoBuildMask=sharedMappedWater;
  try{earthlineBuildVectorNoBuildMask=sharedMappedWater}catch(_){}
  window.EARTHLINE_M82_MAPPED_WATER={installed:true,build:BUILD,at:new Date().toISOString()};
})();
</script>
'''
needle='</body>'
if needle not in s:
    raise SystemExit("body close not found")
s=s.replace(needle,insert+'\n'+needle,1)
p.write_text(s,encoding="utf-8")
print("installed mapped-water continuity",len(s))
