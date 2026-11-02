import fs from 'node:fs';
const path='index.html';
let s=fs.readFileSync(path,'utf8');

// 1) Remove the unproven Mantra 38 swale-scale experiment so this repair has one product scope.
const experimental=`    const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];
    /* MANTRA 38 — Regional swale scale repair. The legacy lineLengthPixels() helper is
       DEM-grid distance, not display pixels. Keep contour science unchanged and give the
       existing swale generator one stable 840×584 reference display so candidate geometry
       no longer grows with jurisdiction size. Existing 10 px minimum and 85 px full-length
       score remain the governing thresholds. */
    function regionalSwaleDisplayLengthPx16584(coords){
      const sx=840/Math.max(1,hy.w-1),sy=584/Math.max(1,hy.h-1);let d=0,last=null;
      for(const ll of coords||[]){const g=llGrid(hy,ll),p={x:g.x*sx,y:g.y*sy};if(last)d+=Math.hypot(p.x-last.x,p.y-last.y);last=p;}
      return d;
    }
    function sampleSegment(coords,center,relaxed){
      let start=center,end=center,lengthPx=0;
      while((lengthPx<85||end-start+1<10)&&(start>0||end<coords.length-1)){
        const leftCost=start>0?regionalSwaleDisplayLengthPx16584([coords[start-1],coords[start]]):Infinity;
        const rightCost=end<coords.length-1?regionalSwaleDisplayLengthPx16584([coords[end],coords[end+1]]):Infinity;
        if(leftCost<=rightCost&&start>0){start--;lengthPx+=leftCost;}
        else if(end<coords.length-1){end++;lengthPx+=rightCost;}
        else break;
      }
      const raw=coords.slice(start,end+1);if(raw.length<10)return null;
      const segment=chaikin(raw,2,false);if(segment.length<10||regionalSwaleDisplayLengthPx16584(segment)<10)return null;`;
const accepted=`    const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];
    function sampleSegment(coords,center,relaxed){
      const half=Math.max(10,Math.min(52,Math.floor(coords.length*.18))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);
      const raw=coords.slice(start,end);if(raw.length<10)return null;
      const segment=chaikin(raw,2,false);if(segment.length<10||lineLengthPixels(hy,segment)<10)return null;`;
if(s.includes(experimental)) s=s.replace(experimental,accepted);
else if(!s.includes(accepted)) throw new Error('Neither experimental nor accepted makeSwales anchor found');
s=s.replace(`      const lengthScore=Math.min(1,regionalSwaleDisplayLengthPx16584(segment)/85);`,`      const lengthScore=Math.min(1,lineLengthPixels(hy,segment)/85);`);

// 2) Restore the 16565 optional-context containment contract inside existing loaders.
const helperAnchor=`  function esriSetToGeoJSON(data){
    const features=(data&&data.features||[]).map(esriPolygonToGeoJSON).filter(Boolean);
    return {type:'FeatureCollection',features};
  }
`;
const helper=`  function esriSetToGeoJSON(data){
    const features=(data&&data.features||[]).map(esriPolygonToGeoJSON).filter(Boolean);
    return {type:'FeatureCollection',features};
  }
  /* EARTHLINE 16565 contract restored — optional HydroBASINS/USGS context for a
     U.S. state is published only when the complete source polygon is inside the
     already-resolved Census state boundary. Cross-boundary polygons are withheld,
     never truncated. This is presentation/context containment only. */
  function earthlineOptionalContextFeatureContained16565(feature,boundary16565){
    const g16565=boundary16565&&(boundary16565.prepared||boundary16565.geometry);
    const geom16565=feature&&feature.geometry;
    if(!g16565||!geom16565)return false;
    const polys16565=geom16565.type==='Polygon'?[geom16565.coordinates||[]]:geom16565.type==='MultiPolygon'?(geom16565.coordinates||[]):[];
    if(!polys16565.length)return false;
    for(const rings16565 of polys16565){
      for(const ring16565 of (rings16565||[])){
        const pts16565=(ring16565||[]).filter(earthlineFinitePoint16539);
        if(pts16565.length<4)return false;
        for(let i16565=0;i16565<pts16565.length;i16565++){
          const a16565=pts16565[i16565],b16565=pts16565[(i16565+1)%pts16565.length];
          if(!earthlinePointInJurisdiction16539(a16565,g16565))return false;
          const steps16565=Math.max(1,Math.ceil(Math.max(Math.abs(Number(b16565[0])-Number(a16565[0])),Math.abs(Number(b16565[1])-Number(a16565[1])))/.01));
          for(let k16565=1;k16565<steps16565;k16565++)if(!earthlinePointInJurisdiction16539(earthlineInterpolate16539(a16565,b16565,k16565/steps16565),g16565))return false;
        }
      }
    }
    return true;
  }
  function earthlineContainOptionalContext16565(geo16565,boundary16565,source16565,runToken16565){
    if(!boundary16565)return geo16565;
    const before16565=Number(geo16565&&geo16565.features&&geo16565.features.length||0);
    const features16565=(geo16565&&geo16565.features||[]).filter(feature16565=>earthlineOptionalContextFeatureContained16565(feature16565,boundary16565));
    const audit16565={build:'EARTHLINE 16565',runToken:runToken16565,source:source16565,before:before16565,after:features16565.length,withheld:Math.max(0,before16565-features16565.length),rule:'whole optional context polygons only; cross-boundary polygons withheld, not clipped',at:new Date().toISOString()};
    window.EARTHLINE_OPTIONAL_CONTEXT_CONTAINMENT_16565=Object.assign({},window.EARTHLINE_OPTIONAL_CONTEXT_CONTAINMENT_16565||{}, {[source16565]:audit16565});
    return {type:'FeatureCollection',features:features16565};
  }
`;
if(!s.includes('function earthlineOptionalContextFeatureContained16565')){
  if(!s.includes(helperAnchor))throw new Error('esriSetToGeoJSON anchor not found');
  s=s.replace(helperAnchor,helper);
}

s=s.replace(`  async function loadWatersheds(b,runToken){`,`  async function loadWatersheds(b,runToken,optionalBoundary16565=null){`);
const basinPublish=`      if(!guardedSetGeo(runToken,map(),IDS.basin,geo,'hydrobasins-temporary-mirror'))return 0;return geo.features.length;`;
const basinContained=`      geo=earthlineContainOptionalContext16565(geo,optionalBoundary16565,'hydrobasins-temporary-mirror',runToken);
      if(!guardedSetGeo(runToken,map(),IDS.basin,geo,'hydrobasins-temporary-mirror'))return 0;return geo.features.length;`;
if(s.includes(basinPublish))s=s.replace(basinPublish,basinContained);
else if(!s.includes(basinContained))throw new Error('HydroBASINS publication anchor not found');

s=s.replace(`  async function loadUSGSKarstAquifers(b,runToken){`,`  async function loadUSGSKarstAquifers(b,runToken,optionalBoundary16565=null){`);
const aquiferNormalize=`      const geo=normalizeUSGSKarst(raw);
      if(!geo.features.length)throw new Error('USGS carbonate/karst layer returned no mapped area for this view');`;
const aquiferContained=`      let geo=normalizeUSGSKarst(raw);
      if(!geo.features.length)throw new Error('USGS carbonate/karst layer returned no mapped area for this view');
      geo=earthlineContainOptionalContext16565(geo,optionalBoundary16565,'usgs-karst-regional-context',runToken);`;
if(s.includes(aquiferNormalize))s=s.replace(aquiferNormalize,aquiferContained);
else if(!s.includes(aquiferContained))throw new Error('USGS normalization anchor not found');

s=s.replace(`  async function loadAquifers(b,runToken){`,`  async function loadAquifers(b,runToken,optionalBoundary16565=null){`);
s=s.replace(`      try{return await loadUSGSKarstAquifers(b,runToken);}`,`      try{return await loadUSGSKarstAquifers(b,runToken,optionalBoundary16565);}`);

const contextAnchor=`        // 16281: optional context begins only after the core Regional result is visible.
        const basinP=focusMode?Promise.resolve(0):withTimeout(loadWatersheds(b,runToken),2000,'watershed context').catch(error=>({error:String(error&&error.message||error)}));
        const aquiferP=focusMode?Promise.resolve(0):withTimeout(loadAquifers(b,runToken),2400,'aquifer context').catch(error=>({error:String(error&&error.message||error)}));`;
const contextContained=`        // 16281: optional context begins only after the core Regional result is visible.
        // EARTHLINE 16565: reuse the run's already-resolved Census boundary; no second lookup.
        const optionalBoundary16565=jurisdictionCapability16539?await jurisdictionBoundaryPromise16539:null;
        const basinP=focusMode?Promise.resolve(0):withTimeout(loadWatersheds(b,runToken,optionalBoundary16565),2000,'watershed context').catch(error=>({error:String(error&&error.message||error)}));
        const aquiferP=focusMode?Promise.resolve(0):withTimeout(loadAquifers(b,runToken,optionalBoundary16565),2400,'aquifer context').catch(error=>({error:String(error&&error.message||error)}));`;
if(s.includes(contextAnchor))s=s.replace(contextAnchor,contextContained);
else if(!s.includes(contextContained))throw new Error('finishContext call anchor not found');

fs.writeFileSync(path,s);
console.log('Restored accepted makeSwales logic and EARTHLINE 16565 optional-context containment contract.');
