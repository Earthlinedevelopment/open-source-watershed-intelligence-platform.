import fs from 'node:fs';

const path='index.html';
let s=fs.readFileSync(path,'utf8');

function functionRange(source,name){
  const start=source.indexOf('function '+name+'(');
  if(start<0)throw new Error('missing function '+name);
  const open=source.indexOf('{',start);
  if(open<0)throw new Error('missing opening brace '+name);
  let depth=0,quote=null,escaped=false,lineComment=false,blockComment=false;
  for(let i=open;i<source.length;i++){
    const c=source[i],n=source[i+1];
    if(lineComment){if(c==='\n')lineComment=false;continue;}
    if(blockComment){if(c==='*'&&n==='/'){blockComment=false;i++;}continue;}
    if(quote){
      if(escaped){escaped=false;continue;}
      if(c==='\\'){escaped=true;continue;}
      if(c===quote)quote=null;
      continue;
    }
    if(c==='/'&&n==='/'){lineComment=true;i++;continue;}
    if(c==='/'&&n==='*'){blockComment=true;i++;continue;}
    if(c==='\''||c==='"'||c==='`'){quote=c;continue;}
    if(c==='{')depth++;
    else if(c==='}'){
      depth--;
      if(depth===0)return {start,end:i+1};
    }
  }
  throw new Error('unterminated function '+name);
}

const replacement=`function earthlineFinalWaterClip16584(hy16584,flows16584,mp16584,runToken16584){
    if(!hy16584||!flows16584||!Array.isArray(flows16584.features)||!mp16584)return flows16584;

    /* MANTRA 38 GLOBAL PUBLICATION GATE.
       One jurisdiction-agnostic owner for every country/state/region:
       1) consume the existing global land-validity mask when present;
       2) after camera settlement, index the surface-water polygons actually exposed by the live map style;
       3) fail closed for FLOW PUBLICATION ONLY when neither evidence source can verify the frame.
       No jurisdiction name, boundary special-case, new listener, timer, observer, renderer or science owner. */
    const scale16584=4,bins16584=Object.create(null),seen16584=new Set();
    let styleFeatureCount16584=0,stylePartCount16584=0,styleSourceCount16584=0,styleCoverageReady16584=false;
    const style16584=(()=>{try{return mp16584.getStyle&&mp16584.getStyle()||null}catch(_){return null}})();
    const surfaceLayer16584=l16584=>{
      const tag16584=(String(l16584&&l16584.id||'')+' '+String(l16584&&l16584['source-layer']||'')).toLowerCase();
      return /water|lake|reservoir|riverbank|ocean|sea/.test(tag16584)&&!/groundwater|aquifer|grace/.test(tag16584);
    };
    const finitePoint16584=p16584=>Array.isArray(p16584)&&Number.isFinite(Number(p16584[0]))&&Number.isFinite(Number(p16584[1]));
    const addPart16584=rings16584=>{
      if(!Array.isArray(rings16584)||!Array.isArray(rings16584[0])||rings16584[0].length<3)return;
      let x016584=Infinity,y016584=Infinity,x116584=-Infinity,y116584=-Infinity;
      for(const p16584 of rings16584[0]){
        if(!finitePoint16584(p16584))continue;
        x016584=Math.min(x016584,Number(p16584[0]));x116584=Math.max(x116584,Number(p16584[0]));
        y016584=Math.min(y016584,Number(p16584[1]));y116584=Math.max(y116584,Number(p16584[1]));
      }
      if(![x016584,y016584,x116584,y116584].every(Number.isFinite))return;
      const key16584=[x016584.toFixed(5),y016584.toFixed(5),x116584.toFixed(5),y116584.toFixed(5),rings16584[0].length].join('|');
      if(seen16584.has(key16584))return;seen16584.add(key16584);
      const part16584={rings:rings16584,bbox:[x016584,y016584,x116584,y116584]};
      stylePartCount16584++;
      const ix016584=Math.floor(x016584*scale16584),ix116584=Math.floor(x116584*scale16584),iy016584=Math.floor(y016584*scale16584),iy116584=Math.floor(y116584*scale16584);
      for(let ix16584=ix016584;ix16584<=ix116584;ix16584++)for(let iy16584=iy016584;iy16584<=iy116584;iy16584++){
        const k16584=ix16584+':'+iy16584;(bins16584[k16584]||(bins16584[k16584]=[])).push(part16584);
      }
    };
    const addGeometry16584=g16584=>{
      if(!g16584)return;
      if(g16584.type==='Polygon')addPart16584(g16584.coordinates);
      else if(g16584.type==='MultiPolygon')for(const p16584 of (g16584.coordinates||[]))addPart16584(p16584);
    };
    if(style16584&&Array.isArray(style16584.layers)){
      const surfaceLayers16584=style16584.layers.filter(surfaceLayer16584),layerIds16584=surfaceLayers16584.map(l16584=>l16584.id).filter(Boolean);
      if(layerIds16584.length&&typeof mp16584.queryRenderedFeatures==='function'){
        try{
          const rendered16584=mp16584.queryRenderedFeatures(undefined,{layers:layerIds16584})||[];
          styleCoverageReady16584=true;styleFeatureCount16584+=rendered16584.length;
          for(const f16584 of rendered16584)addGeometry16584(f16584&&f16584.geometry);
        }catch(_){}
      }
      const pairs16584=new Map();
      for(const l16584 of surfaceLayers16584){
        if(l16584&&l16584.source&&l16584['source-layer'])pairs16584.set(l16584.source+'|'+l16584['source-layer'],[l16584.source,l16584['source-layer']]);
      }
      if(typeof mp16584.querySourceFeatures==='function')for(const pair16584 of pairs16584.values()){
        try{
          const fs16584=mp16584.querySourceFeatures(pair16584[0],{sourceLayer:pair16584[1]})||[];
          styleCoverageReady16584=true;styleSourceCount16584++;styleFeatureCount16584+=fs16584.length;
          for(const f16584 of fs16584)addGeometry16584(f16584&&f16584.geometry);
        }catch(_){}
      }
      /* Fallback for common vector schemas whose water source-layer is present but not directly styled.
         A zero-result fallback does NOT establish coverage; only actual returned water geometry does. */
      if(typeof mp16584.querySourceFeatures==='function')for(const [sourceId16584,sourceDef16584] of Object.entries(style16584.sources||{})){
        if(String(sourceDef16584&&sourceDef16584.type||'').toLowerCase()!=='vector')continue;
        try{
          const fs16584=mp16584.querySourceFeatures(sourceId16584,{sourceLayer:'water'})||[];
          if(!fs16584.length)continue;
          styleCoverageReady16584=true;styleSourceCount16584++;styleFeatureCount16584+=fs16584.length;
          for(const f16584 of fs16584)addGeometry16584(f16584&&f16584.geometry);
        }catch(_){}
      }
    }
    const styleIndex16584={available:styleCoverageReady16584,scale:scale16584,bins:bins16584,featureCount:styleFeatureCount16584,partCount:stylePartCount16584,sourceCount:styleSourceCount16584};
    hy16584.styleWaterIndex16584=styleIndex16584;

    const hasGrid16584=!!hy16584.validityMask16584;
    const evidenceReady16584=hasGrid16584||styleCoverageReady16584;
    const pointValid16584=p16584=>{
      if(!finitePoint16584(p16584))return false;
      if(hasGrid16584){
        const g16584=llGrid(hy16584,p16584),x16584=Math.max(0,Math.min(hy16584.w-1,Math.round(g16584.x))),y16584=Math.max(0,Math.min(hy16584.h-1,Math.round(g16584.y)));
        if(!hy16584.validityMask16584[y16584*hy16584.w+x16584])return false;
      }
      const waterParts16584=Array.isArray(hy16584.waterParts16584)?hy16584.waterParts16584:[];
      const lng16584=Number(p16584[0]),lat16584=Number(p16584[1]);
      for(const part16584 of waterParts16584){
        if(!part16584||!part16584.bbox||!part16584.rings)continue;
        if(lng16584<part16584.bbox[0]||lng16584>part16584.bbox[2]||lat16584<part16584.bbox[1]||lat16584>part16584.bbox[3])continue;
        if(earthlinePointInPolygon16584(lng16584,lat16584,part16584.rings))return false;
      }
      const candidates16584=bins16584[Math.floor(lng16584*scale16584)+':'+Math.floor(lat16584*scale16584)]||[];
      for(const part16584 of candidates16584){
        if(!part16584||!part16584.bbox||!part16584.rings)continue;
        if(lng16584<part16584.bbox[0]||lng16584>part16584.bbox[2]||lat16584<part16584.bbox[1]||lat16584>part16584.bbox[3])continue;
        if(earthlinePointInPolygon16584(lng16584,lat16584,part16584.rings))return false;
      }
      return evidenceReady16584;
    };
    const segmentValid16584=(a16584,b16584)=>{
      if(!pointValid16584(a16584)||!pointValid16584(b16584))return false;
      const ga16584=llGrid(hy16584,a16584),gb16584=llGrid(hy16584,b16584),steps16584=Math.max(2,Math.ceil(Math.hypot(gb16584.x-ga16584.x,gb16584.y-ga16584.y)*4));
      for(let s16584=1;s16584<steps16584;s16584++){
        const t16584=s16584/steps16584,p16584=[Number(a16584[0])+(Number(b16584[0])-Number(a16584[0]))*t16584,Number(a16584[1])+(Number(b16584[1])-Number(a16584[1]))*t16584];
        if(!pointValid16584(p16584))return false;
      }
      return true;
    };

    const kept16584=[],arrows16584=[];
    let inputLines16584=0,outputLines16584=0,clippedLines16584=0,droppedLines16584=0;
    for(const f16584 of flows16584.features){
      const kind16584=f16584&&f16584.properties&&f16584.properties.feature_type;
      if(kind16584==='flow-arrow')continue;
      if(kind16584!=='flow'||!f16584.geometry||f16584.geometry.type!=='LineString'||!Array.isArray(f16584.geometry.coordinates)){
        kept16584.push(f16584);continue;
      }
      inputLines16584++;
      if(!evidenceReady16584){droppedLines16584++;continue;}
      const src16584=f16584.geometry.coordinates,out16584=[];
      for(const p16584 of src16584){
        if(!finitePoint16584(p16584))break;
        if(out16584.length===0){if(!pointValid16584(p16584))break;out16584.push(p16584);continue;}
        if(!segmentValid16584(out16584[out16584.length-1],p16584))break;
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
    window.EARTHLINE_STYLE_WATER_INDEX_16584={
      build:'EARTHLINE 16584',runToken:runToken16584,phase:'final-publication-global',
      jurisdictionAgnostic:true,landGridAvailable:hasGrid16584,styleCoverageReady:styleCoverageReady16584,
      featureCount:styleFeatureCount16584,partCount:stylePartCount16584,sourceCount:styleSourceCount16584,
      inputLines:inputLines16584,outputLines:outputLines16584,clippedLines:clippedLines16584,droppedLines:droppedLines16584,
      failClosedNoEvidence:!evidenceReady16584,at:new Date().toISOString()
    };
    return {...flows16584,features:kept16584.concat(arrows16584)};
  }`;

const range=functionRange(s,'earthlineFinalWaterClip16584');
s=s.slice(0,range.start)+replacement+s.slice(range.end);

if(/New York|Lake Ontario|\bNY\b/.test(replacement))throw new Error('jurisdiction-specific publication logic is forbidden');
fs.writeFileSync(path,s);
console.log('MANTRA38_GLOBAL_WATER_GATE '+JSON.stringify({patched:true,jurisdictionSpecific:false,owner:'earthlineFinalWaterClip16584'}));
