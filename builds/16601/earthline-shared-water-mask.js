(function(){
  'use strict';
  const BUILD='EARTHLINE-LAB-16601-PORTABLE-MAPPED-WATER-AUTHORITY';
  if(window.EARTHLINE_LAB_WATER_16601&&window.EARTHLINE_LAB_WATER_16601.installed)return;

  const base=window.earthlineBuildVectorNoBuildMask;
  if(typeof base!=='function'){
    window.EARTHLINE_LAB_WATER_16601={installed:false,error:'earthlineBuildVectorNoBuildMask unavailable',at:new Date().toISOString()};
    return;
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
  function portableRun(){
    try{return !!(M&&M.propertyJurisdiction16516&&M.propertyJurisdiction16516.mode==='portable-non-vermont')}catch(_){return false}
  }
  function analysisBox(){
    try{
      const p=M&&M.analysisBoundaryLngLat||[];
      if(!Array.isArray(p)||p.length<3)return null;
      return {
        minLng:Math.min(...p.map(x=>Number(x[0]))),maxLng:Math.max(...p.map(x=>Number(x[0]))),
        minLat:Math.min(...p.map(x=>Number(x[1]))),maxLat:Math.max(...p.map(x=>Number(x[1])))
      };
    }catch(_){return null}
  }
  function failClosed(reason,detail){
    const c=(typeof M!=='undefined'&&M&&M.vectorNoBuildCoverage)?M.vectorNoBuildCoverage:{};
    c.mappedWater16601=Object.assign({owner:'vectorNoBuild15778',status:'failed',reason,build:BUILD,at:new Date().toISOString()},detail||{});
    c.publicationAllowed=false;c.verified=false;c.exclusionVerified=false;
    try{if(typeof earthlineSetVectorVerification16343==='function')earthlineSetVectorVerification16343(c,'failed',reason);}catch(_){ }
    if(typeof M!=='undefined'&&M)M.vectorNoBuildCoverage=c;
    try{
      if(typeof EarthlinePrescriptionHalt==='function')throw new EarthlinePrescriptionHalt(reason,{build:BUILD,stage:'mapped-water-mask',detail:detail||{}});
    }catch(e){if(e&&e.name&&/EarthlinePrescriptionHalt/i.test(String(e.name)))throw e;}
    const e=new Error(reason);e.code='EARTHLINE_MAPPED_WATER_UNVERIFIED';throw e;
  }

  function closed(coords){
    if(!Array.isArray(coords)||coords.length<4)return false;
    const a=coords[0],b=coords[coords.length-1];
    return !!(a&&b&&Number(a[0])===Number(b[0])&&Number(a[1])===Number(b[1]));
  }
  function waterTags(tags){
    tags=tags||{};
    const natural=String(tags.natural||'').toLowerCase();
    const waterway=String(tags.waterway||'').toLowerCase();
    return natural==='water'||natural==='wetland'||waterway==='riverbank'||!!tags.water;
  }
  function featureFromGeometry(coords,tags,id,role){
    if(!Array.isArray(coords)||coords.length<2)return null;
    const area=waterTags(tags)&&closed(coords);
    return {
      type:'Feature',id:String(id||''),
      properties:Object.assign({},tags||{},role?{earthline_relation_role:role}:{}),
      sourceLayer:'water',
      layer:{id:'earthline-portable-mapped-water-16601','source-layer':'water',type:area?'fill':'line'},
      geometry:area?{type:'Polygon',coordinates:[coords]}:{type:'LineString',coordinates:coords}
    };
  }
  function overpassFeatures(data){
    const out=[];
    for(const el of (data&&Array.isArray(data.elements)?data.elements:[])){
      const tags=el&&el.tags||{};
      if(el&&Array.isArray(el.geometry)){
        const coords=el.geometry.map(p=>[Number(p.lon),Number(p.lat)]).filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1]));
        const f=featureFromGeometry(coords,tags,'way:'+el.id,'');if(f)out.push(f);
      }
      if(el&&el.type==='relation'&&Array.isArray(el.members)){
        let n=0;
        for(const m of el.members){
          if(!m||!Array.isArray(m.geometry))continue;
          const coords=m.geometry.map(p=>[Number(p.lon),Number(p.lat)]).filter(p=>Number.isFinite(p[0])&&Number.isFinite(p[1]));
          const f=featureFromGeometry(coords,tags,'relation:'+el.id+':'+(n++),String(m.role||''));if(f)out.push(f);
        }
      }
    }
    return out;
  }
  async function acquirePortableMappedWater16601(gen,tb){
    if(!tb)return failClosed('mapped-water-analysis-box-unavailable',{});
    const bbox=[tb.minLat,tb.minLng,tb.maxLat,tb.maxLng].map(v=>Number(v).toFixed(7)).join(',');
    const query='[out:json][timeout:8];('+[
      'way["natural"="water"]('+bbox+')','relation["natural"="water"]('+bbox+')',
      'way["natural"="wetland"]('+bbox+')','relation["natural"="wetland"]('+bbox+')',
      'way["waterway"="riverbank"]('+bbox+')','relation["waterway"="riverbank"]('+bbox+')',
      'way["waterway"~"^(river|stream|canal|ditch|drain)$"]('+bbox+')',
      'way["natural"="coastline"]('+bbox+')',
      'way["water"]('+bbox+')','relation["water"]('+bbox+')'
    ].join(';')+';);out geom;';
    const controller=typeof AbortController!=='undefined'?new AbortController():null;
    const timer=controller?setTimeout(()=>controller.abort(),9000):null;
    try{
      const response=await fetch('https://overpass-api.de/api/interpreter',{
        method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
        body:'data='+encodeURIComponent(query),signal:controller?controller.signal:undefined,cache:'no-store'
      });
      if(!response.ok)throw new Error('HTTP '+response.status);
      const data=await response.json();
      if(stale(gen))return null;
      return {features:overpassFeatures(data),elementCount:Array.isArray(data&&data.elements)?data.elements.length:0,bbox};
    }catch(e){
      return failClosed('mapped-water-open-data-acquisition-failed',{source:'existing-portable-overpass',error:String(e&&e.message||e),bbox});
    }finally{if(timer)clearTimeout(timer);}
  }

  async function mappedWaterPass16601(gen,baseResult){
    if(!propertyRun()||!portableRun()||stale(gen))return baseResult;
    if(typeof earthlineProcessMappedFeature!=='function')return failClosed('mapped-water-rasterizer-unavailable',{});
    const tb=analysisBox();
    const acquired=await acquirePortableMappedWater16601(gen,tb);
    if(!acquired||stale(gen))return false;

    const rawWaterMask=new Uint8Array(N),dummy=new Uint8Array(N);
    let processed=0;
    for(let i=0;i<acquired.features.length;i++){
      if(stale(gen))return false;
      processed+=Number(earthlineProcessMappedFeature(rawWaterMask,dummy,acquired.features[i])||0);
      if((i&63)===63){try{if(typeof earthlineTaskYield16464==='function')await earthlineTaskYield16464();}catch(_){ }}
    }

    const merged=(M.vectorNoBuildMask&&M.vectorNoBuildMask.length===N)?new Uint8Array(M.vectorNoBuildMask):new Uint8Array(N);
    let waterCells=0,addedCells=0;
    for(let i=0;i<N;i++)if(rawWaterMask[i]){waterCells++;if(!merged[i])addedCells++;merged[i]=1;}

    M.vectorNoBuildMask=merged;
    M.vectorNoBuildStamp=String(M.vectorNoBuildStamp||'')+'|mapped-water-16601:'+waterCells+':'+addedCells;
    M._noBuildStamp=null;
    M.noBuildProvenance15843=null;
    const c=M.vectorNoBuildCoverage||{};
    c.mappedWater16601={
      owner:'vectorNoBuild15778',status:'verified',source:'existing-portable-overpass',acquisitionResult:'verified-response',
      queryMode:'dedicated run-scoped mapped-water acquisition before final no-build union',bbox:acquired.bbox,
      sourceElements:acquired.elementCount,waterFeatures:acquired.features.length,processedWaterGeometries:processed,
      waterCells,addedCells,sharedFinalMask:'M.vectorNoBuildMask -> M.noBuildMask',
      corridorGate:'existing final no-build mask',rechargeGate:'existing final hard-block prefilter/containment gate',
      build:BUILD,at:new Date().toISOString()
    };
    M.vectorNoBuildCoverage=c;
    window.EARTHLINE_LAB_WATER_16601={installed:true,lastRun:{gen:Number(gen),sourceElements:acquired.elementCount,waterFeatures:acquired.features.length,waterCells,addedCells,at:new Date().toISOString()},build:BUILD};
    return baseResult;
  }

  async function sharedMappedWater16601(gen){
    const result=await base(gen);
    if(stale(gen))return false;
    return mappedWaterPass16601(gen,result);
  }

  window.earthlineBuildVectorNoBuildMask=sharedMappedWater16601;
  try{earthlineBuildVectorNoBuildMask=sharedMappedWater16601}catch(_){ }
  window.EARTHLINE_LAB_WATER_16601={installed:true,build:BUILD,at:new Date().toISOString()};
})();
