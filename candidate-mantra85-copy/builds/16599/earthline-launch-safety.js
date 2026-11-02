(function(){
  'use strict';
  const BUILD='EARTHLINE-LAB-16599-MAPPED-WATER-SAFETY';
  if(window.EARTHLINE_LAB_WATER_16599&&window.EARTHLINE_LAB_WATER_16599.installed)return;

  const base=window.earthlineBuildVectorNoBuildMask;
  if(typeof base!=='function'){
    window.EARTHLINE_LAB_WATER_16599={installed:false,error:'earthlineBuildVectorNoBuildMask unavailable',at:new Date().toISOString()};
    return;
  }

  function liveMap(){
    try{return window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null)||null}catch(_){return window.earthlineMap||null}
  }

  async function mappedWaterBuild16599(gen){
    const mp=liveMap();
    if(!mp||typeof mp.querySourceFeatures!=='function')return await base(gen);

    const originalQuery=mp.querySourceFeatures;
    const semanticCache=new Map();
    let semanticQueries=0,semanticFeatures=0,sourceTouches=0;

    function semanticWater(source){
      const key=String(source||'');
      if(semanticCache.has(key))return semanticCache.get(key);
      const out=[];
      for(const sourceLayer of ['water','waterway']){
        try{
          semanticQueries++;
          const rows=originalQuery.call(mp,source,{sourceLayer})||[];
          for(const f of rows){
            out.push(Object.assign({},f,{sourceLayer:(f&&f.sourceLayer)||sourceLayer}));
            semanticFeatures++;
          }
        }catch(_){ }
      }
      semanticCache.set(key,out);
      return out;
    }

    mp.querySourceFeatures=function(source,options){
      const primary=originalQuery.call(this,source,options)||[];
      const requested=String(options&&options.sourceLayer||'').toLowerCase();
      if(requested==='water'||requested==='waterway')return primary;
      const extra=semanticWater(source);
      if(extra.length)sourceTouches++;
      return extra.length?primary.concat(extra):primary;
    };

    try{
      const result=await base(gen);
      try{
        const coverage=(typeof M!=='undefined'&&M&&M.vectorNoBuildCoverage)?M.vectorNoBuildCoverage:null;
        if(coverage){
          coverage.semanticMappedWater16599={
            owner:'vectorNoBuild15778',
            queryMode:'loaded-vector-source water + waterway',
            semanticQueries,
            semanticFeatures,
            sourceTouches,
            finalMaskOwner:'M.vectorNoBuildMask -> M.noBuildMask',
            rechargeGate:'existing earthlineRechargeZoneFitsProperty16326 full-footprint final-no-build containment'
          };
        }
        window.EARTHLINE_LAB_WATER_16599={
          installed:true,lastRun:{gen:Number(gen),semanticQueries,semanticFeatures,sourceTouches,result:!!result,at:new Date().toISOString()}
        };
      }catch(_){ }
      return result;
    }finally{
      mp.querySourceFeatures=originalQuery;
    }
  }

  window.earthlineBuildVectorNoBuildMask=mappedWaterBuild16599;
  try{earthlineBuildVectorNoBuildMask=mappedWaterBuild16599}catch(_){ }
  window.EARTHLINE_LAB_WATER_16599={installed:true,at:new Date().toISOString(),build:BUILD};
})();
