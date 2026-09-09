(function(){
  'use strict';
  const BUILD='EARTHLINE-LAB-16601-PORTABLE-MAPPED-WATER-AUTHORITY';
  if(window.EARTHLINE_LAB_WATER_16601&&window.EARTHLINE_LAB_WATER_16601.installed)return;

  const base=window.earthlineBuildVectorNoBuildMask;
  if(typeof base!=='function'){
    window.EARTHLINE_LAB_WATER_16601={installed:false,error:'earthlineBuildVectorNoBuildMask unavailable',at:new Date().toISOString()};
    return;
  }

  function stale(gen){try{return typeof earthlineIsStale==='function'&&earthlineIsStale(gen)}catch(_){return false}}
  function propertyRun(){try{const loc=M&&M.loc||{};return !(/Regional Opportunity Tile/i.test(String(loc.name||''))||(Array.isArray(loc.zones)&&loc.zones.includes('Regional Tile')))}catch(_){return false}}
  function portableRun(){try{return !!(M&&M.propertyJurisdiction16516&&M.propertyJurisdiction16516.mode==='portable-non-vermont')}catch(_){return false}}
  function analysisBox(){try{const p=M&&M.analysisBoundaryLngLat||[];if(!Array.isArray(p)||p.length<3)return null;return {minLng:Math.min(...p.map(x=>Number(x[0]))),maxLng:Math.max(...p.map(x=>Number(x[0]))),minLat:Math.min(...p.map(x=>Number(x[1]))),maxLat:Math.max(...p.map(x=>Number(x[1])))}}catch(_){return null}}
  function failClosed(reason,detail){
    const c=(typeof M!=='undefined'&&M&&M.vectorNoBuildCoverage)?M.vectorNoBuildCoverage:{};
    c.mappedWater16601=Object.assign({owner:'vectorNoBuild15778',status:'failed',reason,build:BUILD,at:new Date().toISOString()},detail||{});
    c.publicationAllowed=false;c.verified=false;c.exclusionVerified=false;
    try{if(typeof earthlineSetVectorVerification16343==='function')earthlineSetVectorVerification16343(c,'failed',reason)}catch(_){ }
    if(typeof M!=='undefined'&&M)M.vectorNoBuildCoverage=c;
    try{if(typeof EarthlinePrescriptionHalt==='function')throw new EarthlinePrescriptionHalt(reason,{build:BUILD,stage:'mapped-water-mask',detail:detail||{}})}catch(e){if(e&&e.name&&/EarthlinePrescriptionHalt/i.test(String(e.name)))throw e}
    const e=new Error(reason);e.code='EARTHLINE_MAPPED_WATER_UNVERIFIED';throw e;
  }

  function pt(p){return Array.isArray(p)&&p.length>=2&&Number.isFinite(Number(p[0]))&&Number.isFinite(Number(p[1]))?[Number(p[0]),Number(p[1])]:null}
  function same(a,b){return !!(a&&b&&Math.abs(a[0]-b[0])<1e-7&&Math.abs(a[1]-b[1])<1e-7)}
  function closed(coords){return Array.isArray(coords)&&coords.length>=4&&same(coords[0],coords[coords.length-1])}
  function waterTags(tags){tags=tags||{};const natural=String(tags.natural||'').toLowerCase(),waterway=String(tags.waterway||'').toLowerCase();return natural==='water'||natural==='wetland'||waterway==='riverbank'||!!tags.water}
  function coordsFromGeometry(g){return (Array.isArray(g)?g:[]).map(p=>pt([p.lon,p.lat])).filter(Boolean)}
  function featureFromGeometry(coords,tags,id,role){
    if(!Array.isArray(coords)||coords.length<2)return null;
    const area=waterTags(tags)&&closed(coords);
    return {type:'Feature',id:String(id||''),properties:Object.assign({},tags||{},role?{earthline_relation_role:role}:{}),sourceLayer:'water',layer:{id:'earthline-portable-mapped-water-16601','source-layer':'water',type:area?'fill':'line'},geometry:area?{type:'Polygon',coordinates:[coords]}:{type:'LineString',coordinates:coords}};
  }
  function stitch(segs){
    const left=segs.filter(s=>Array.isArray(s)&&s.length>=2).map(s=>s.slice()),rings=[],open=[];
    while(left.length){
      let ring=left.shift(),changed=true;
      while(changed&&!closed(ring)){
        changed=false;
        const first=ring[0],last=ring[ring.length-1];
        for(let i=0;i<left.length;i++){
          let s=left[i];
          if(same(last,s[0])){ring=ring.concat(s.slice(1));left.splice(i,1);changed=true;break}
          if(same(last,s[s.length-1])){s=s.slice().reverse();ring=ring.concat(s.slice(1));left.splice(i,1);changed=true;break}
          if(same(first,s[s.length-1])){ring=s.slice(0,-1).concat(ring);left.splice(i,1);changed=true;break}
          if(same(first,s[0])){s=s.slice().reverse();ring=s.slice(0,-1).concat(ring);left.splice(i,1);changed=true;break}
        }
      }
      if(closed(ring))rings.push(ring);else open.push(ring);
    }
    return {rings,open};
  }
  function pointInRing(p,ring){
    let inside=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];
      const cross=((yi>p[1])!==(yj>p[1]))&&(p[0]<(xj-xi)*(p[1]-yi)/((yj-yi)||1e-12)+xi);
      if(cross)inside=!inside;
    }
    return inside;
  }
  function relationFeatures(el){
    const tags=el&&el.tags||{},members=Array.isArray(el&&el.members)?el.members:[],out=[];
    if(!waterTags(tags))return out;
    const outerSegs=[],innerSegs=[];
    for(const m of members){
      const c=coordsFromGeometry(m&&m.geometry);if(c.length<2)continue;
      if(String(m.role||'').toLowerCase()==='inner')innerSegs.push(c);else outerSegs.push(c);
    }
    const outer=stitch(outerSegs),inner=stitch(innerSegs);
    let n=0;
    for(const ring of outer.rings){
      const holes=inner.rings.filter(h=>h[0]&&pointInRing(h[0],ring));
      out.push({type:'Feature',id:'relation:'+el.id+':area:'+(n++),properties:Object.assign({},tags),sourceLayer:'water',layer:{id:'earthline-portable-mapped-water-16601','source-layer':'water',type:'fill'},geometry:{type:'Polygon',coordinates:[ring].concat(holes)}});
    }
    for(const seg of outer.open){const f=featureFromGeometry(seg,tags,'relation:'+el.id+':open:'+(n++),'outer');if(f)out.push(f)}
    return out;
  }
  function overpassFeatures(data){
    const out=[];
    for(const el of (data&&Array.isArray(data.elements)?data.elements:[])){
      const tags=el&&el.tags||{};
      if(el&&el.type==='relation'){out.push(...relationFeatures(el));continue}
      if(el&&Array.isArray(el.geometry)){
        const coords=coordsFromGeometry(el.geometry);
        const f=featureFromGeometry(coords,tags,'way:'+el.id,'');if(f)out.push(f);
      }
    }
    return out;
  }
  async function acquirePortableMappedWater16601(gen,tb){
    if(!tb)return failClosed('mapped-water-analysis-box-unavailable',{});
    const bbox=[tb.minLat,tb.minLng,tb.maxLat,tb.maxLng].map(v=>Number(v).toFixed(7)).join(',');
    const query='[out:json][timeout:11];('+[
      'way["natural"="water"]('+bbox+')','relation["natural"="water"]('+bbox+')',
      'way["natural"="wetland"]('+bbox+')','relation["natural"="wetland"]('+bbox+')',
      'way["waterway"="riverbank"]('+bbox+')','relation["waterway"="riverbank"]('+bbox+')',
      'way["waterway"~"^(river|stream|canal|ditch|drain)$"]('+bbox+')','way["natural"="coastline"]('+bbox+')',
      'way["water"]('+bbox+')','relation["water"]('+bbox+')'
    ].join(';')+';);out geom;';
    const controller=typeof AbortController!=='undefined'?new AbortController():null;
    const timer=controller?setTimeout(()=>controller.abort(),12500):null;
    try{
      const response=await fetch('https://overpass.kumi.systems/api/interpreter',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body:'data='+encodeURIComponent(query),signal:controller?controller.signal:undefined,cache:'no-store'});
      if(!response.ok)throw new Error('HTTP '+response.status);
      const data=await response.json();if(stale(gen))return null;
      return {features:overpassFeatures(data),elementCount:Array.isArray(data&&data.elements)?data.elements.length:0,bbox,endpoint:'overpass.kumi.systems'};
    }catch(e){return failClosed('mapped-water-open-data-acquisition-failed',{source:'existing-portable-overpass',endpoint:'overpass.kumi.systems',error:String(e&&e.message||e),bbox})}
    finally{if(timer)clearTimeout(timer)}
  }

  async function applyMappedWater16601(gen,baseResult,acquired){
    if(!propertyRun()||!portableRun()||stale(gen))return baseResult;
    if(typeof earthlineProcessMappedFeature!=='function')return failClosed('mapped-water-rasterizer-unavailable',{});
    if(!acquired||stale(gen))return false;
    const rawWaterMask=new Uint8Array(N),dummy=new Uint8Array(N);let processed=0;
    for(let i=0;i<acquired.features.length;i++){
      if(stale(gen))return false;
      processed+=Number(earthlineProcessMappedFeature(rawWaterMask,dummy,acquired.features[i])||0);
      if((i&63)===63){try{if(typeof earthlineTaskYield16464==='function')await earthlineTaskYield16464()}catch(_){ }}
    }
    const merged=(M.vectorNoBuildMask&&M.vectorNoBuildMask.length===N)?new Uint8Array(M.vectorNoBuildMask):new Uint8Array(N);
    let waterCells=0,addedCells=0;
    for(let i=0;i<N;i++)if(rawWaterMask[i]){waterCells++;if(!merged[i])addedCells++;merged[i]=1}
    M.vectorNoBuildMask=merged;M.mappedWaterMask16601=rawWaterMask;
    M.vectorNoBuildStamp=String(M.vectorNoBuildStamp||'')+'|mapped-water-16601:'+waterCells+':'+addedCells;M._noBuildStamp=null;M.noBuildProvenance15843=null;
    const c=M.vectorNoBuildCoverage||{};
    c.mappedWater16601={owner:'vectorNoBuild15778',status:'verified',source:'existing-portable-overpass',endpoint:acquired.endpoint,acquisitionResult:'verified-response',queryMode:'parallel run-scoped mapped-water acquisition before final no-build union',bbox:acquired.bbox,sourceElements:acquired.elementCount,waterFeatures:acquired.features.length,processedWaterGeometries:processed,waterCells,addedCells,sharedFinalMask:'M.vectorNoBuildMask -> M.noBuildMask',corridorGate:'existing final no-build mask',rechargeGate:'existing final hard-block prefilter/containment gate',build:BUILD,at:new Date().toISOString()};
    M.vectorNoBuildCoverage=c;
    window.EARTHLINE_LAB_WATER_16601={installed:true,lastRun:{gen:Number(gen),sourceElements:acquired.elementCount,waterFeatures:acquired.features.length,waterCells,addedCells,endpoint:acquired.endpoint,at:new Date().toISOString()},build:BUILD};
    return baseResult;
  }

  async function sharedMappedWater16601(gen){
    const shouldAcquire=propertyRun()&&portableRun()&&!stale(gen),tb=shouldAcquire?analysisBox():null;
    const waterPromise=shouldAcquire?acquirePortableMappedWater16601(gen,tb).then(v=>({value:v}),error=>({error})):null;
    const result=await base(gen);if(stale(gen))return false;
    if(!waterPromise)return result;
    const waterResult=await waterPromise;if(waterResult.error)throw waterResult.error;
    return applyMappedWater16601(gen,result,waterResult.value);
  }

  window.earthlineBuildVectorNoBuildMask=sharedMappedWater16601;
  try{earthlineBuildVectorNoBuildMask=sharedMappedWater16601}catch(_){ }
  window.EARTHLINE_LAB_WATER_16601={installed:true,build:BUILD,at:new Date().toISOString()};
})();
