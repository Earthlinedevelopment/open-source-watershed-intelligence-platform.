import fs from 'node:fs';
const path='index.html';
let s=fs.readFileSync(path,'utf8');

const helperMarker='  function earthlineRegionalSegmentValid16584(hy16584,a16584,b16584){';
if(!s.includes(helperMarker)) throw new Error('16584 segment-validity owner marker not found');
if(!s.includes('function earthlineFinalWaterClip16584(')){
  const helper=`  function earthlineFinalWaterClip16584(hy16584,flows16584,mp16584,runToken16584){
    if(!hy16584||!hy16584.validityMask16584||!flows16584||!Array.isArray(flows16584.features)||!mp16584)return flows16584;
    hy16584.styleWaterIndex16584=earthlineLoadedStyleWaterIndex16584(mp16584,hy16584.bounds);
    const kept16584=[],arrows16584=[];
    let inputLines16584=0,outputLines16584=0,clippedLines16584=0,droppedLines16584=0;
    for(const f16584 of flows16584.features){
      const kind16584=f16584&&f16584.properties&&f16584.properties.feature_type;
      if(kind16584==='flow-arrow')continue;
      if(kind16584!=='flow'||!f16584.geometry||f16584.geometry.type!=='LineString'||!Array.isArray(f16584.geometry.coordinates)){
        kept16584.push(f16584);continue;
      }
      inputLines16584++;
      const src16584=f16584.geometry.coordinates,out16584=[];
      for(const p16584 of src16584){
        if(!Array.isArray(p16584)||!Number.isFinite(Number(p16584[0]))||!Number.isFinite(Number(p16584[1])))break;
        if(out16584.length===0){if(!earthlineRegionalPointValid16584(hy16584,p16584))break;out16584.push(p16584);continue;}
        if(!earthlineRegionalSegmentValid16584(hy16584,out16584[out16584.length-1],p16584))break;
        out16584.push(p16584);
      }
      if(out16584.length<8){droppedLines16584++;continue;}
      if(out16584.length<src16584.length)clippedLines16584++;
      outputLines16584++;
      kept16584.push({...f16584,geometry:{...f16584.geometry,coordinates:out16584}});
      const step16584=Math.max(4,Math.floor(out16584.length/8));
      for(let k16584=step16584;k16584<out16584.length;k16584+=step16584){
        arrows16584.push({type:'Feature',properties:{rank:f16584.properties&&f16584.properties.rank,feature_type:'flow-arrow'},geometry:{type:'Point',coordinates:out16584[k16584]}});
      }
    }
    const index16584=hy16584.styleWaterIndex16584||{};
    window.EARTHLINE_STYLE_WATER_INDEX_16584={build:'EARTHLINE 16584',runToken:runToken16584,phase:'final-publication',featureCount:Number(index16584.featureCount||0),partCount:Number(index16584.partCount||0),sourceCount:Number(index16584.sourceCount||0),binCount:Object.keys(index16584.bins||{}).length,inputLines:inputLines16584,outputLines:outputLines16584,clippedLines:clippedLines16584,droppedLines:droppedLines16584,at:new Date().toISOString()};
    return {...flows16584,features:kept16584.concat(arrows16584)};
  }\n\n`;
  s=s.replace(helperMarker,helper+helperMarker);
}

const settle='const cameraReady16334=await cameraSettle16310(runToken,regionalCenter,runBounds16334);';
if(!s.includes(settle))throw new Error('camera settle call not found');
const finalClip=`${settle}\n    if(cameraReady16334&&!focusMode&&hy&&hy.validityMask16584){\n      flows=earthlineFinalWaterClip16584(hy,flows,map(),runToken);\n    }`;
if(!s.includes('flows=earthlineFinalWaterClip16584(hy,flows,map(),runToken);'))s=s.replace(settle,finalClip);

fs.writeFileSync(path,s);
console.log('Final 16584 flow containment refresh now runs after the existing camera/tile settle and before atomic publication; no source, layer, listener, renderer, camera, idle, polling, or verdict owner added.');
