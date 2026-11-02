import fs from 'node:fs';
const path='index.html';
let s=fs.readFileSync(path,'utf8');

const oldPoint=`  function earthlineRegionalPointValid16584(hy16584,ll16584){
    if(!hy16584||!hy16584.validityMask16584)return true;
    const g16584=llGrid(hy16584,ll16584),
          x16584=Math.max(0,Math.min(hy16584.w-1,Math.round(g16584.x))),
          y16584=Math.max(0,Math.min(hy16584.h-1,Math.round(g16584.y)));
    if(!hy16584.validityMask16584[y16584*hy16584.w+x16584])return false;
    const waterParts16584=Array.isArray(hy16584.waterParts16584)?hy16584.waterParts16584:[];
    if(waterParts16584.length&&ll16584&&Number.isFinite(Number(ll16584[0]))&&Number.isFinite(Number(ll16584[1]))){
      const lng16584=Number(ll16584[0]),lat16584=Number(ll16584[1]);
      for(const part16584 of waterParts16584){
        if(!part16584||!part16584.bbox||!part16584.rings)continue;
        if(lng16584<part16584.bbox[0]||lng16584>part16584.bbox[2]||lat16584<part16584.bbox[1]||lat16584>part16584.bbox[3])continue;
        if(earthlinePointInPolygon16584(lng16584,lat16584,part16584.rings))return false;
      }
    }
    return true;
  }`;

const newPoint=`  function earthlineLoadedStyleWaterIndex16584(mp16584){
    const scale16584=4,bins16584=Object.create(null),seen16584=new Set();
    let featureCount16584=0,partCount16584=0,sourceCount16584=0;
    if(!mp16584||typeof mp16584.getStyle!=="function"||typeof mp16584.querySourceFeatures!=="function")return {scale:scale16584,bins:bins16584,featureCount:0,partCount:0,sourceCount:0};
    let style16584=null;try{style16584=mp16584.getStyle()||null}catch(_){style16584=null}
    if(!style16584||!style16584.sources)return {scale:scale16584,bins:bins16584,featureCount:0,partCount:0,sourceCount:0};
    let view16584=null;try{const vb16584=mp16584.getBounds&&mp16584.getBounds();if(vb16584)view16584=[vb16584.getWest(),vb16584.getSouth(),vb16584.getEast(),vb16584.getNorth()]}catch(_){view16584=null}
    const addPart16584=rings16584=>{
      if(!Array.isArray(rings16584)||!Array.isArray(rings16584[0])||rings16584[0].length<4)return;
      let x016584=Infinity,y016584=Infinity,x116584=-Infinity,y116584=-Infinity;
      for(const p16584 of rings16584[0]){const x16584=Number(p16584&&p16584[0]),y16584=Number(p16584&&p16584[1]);if(!Number.isFinite(x16584)||!Number.isFinite(y16584))continue;x016584=Math.min(x016584,x16584);x116584=Math.max(x116584,x16584);y016584=Math.min(y016584,y16584);y116584=Math.max(y116584,y16584)}
      if(![x016584,y016584,x116584,y116584].every(Number.isFinite))return;
      if(view16584&&(x116584<view16584[0]||x016584>view16584[2]||y116584<view16584[1]||y016584>view16584[3]))return;
      const first16584=rings16584[0][0]||[0,0],key16584=[x016584,y016584,x116584,y116584].map(v16584=>v16584.toFixed(5)).join(',')+'|'+rings16584[0].length+'|'+Number(first16584[0]).toFixed(5)+','+Number(first16584[1]).toFixed(5);
      if(seen16584.has(key16584))return;seen16584.add(key16584);
      const part16584={rings:rings16584,bbox:[x016584,y016584,x116584,y116584]};partCount16584++;
      const ix016584=Math.floor(x016584*scale16584),ix116584=Math.floor(x116584*scale16584),iy016584=Math.floor(y016584*scale16584),iy116584=Math.floor(y116584*scale16584);
      for(let ix16584=ix016584;ix16584<=ix116584;ix16584++)for(let iy16584=iy016584;iy16584<=iy116584;iy16584++){const k16584=ix16584+':'+iy16584;(bins16584[k16584]||(bins16584[k16584]=[])).push(part16584)}
    };
    for(const [sourceId16584,sourceDef16584] of Object.entries(style16584.sources||{})){
      if(String(sourceDef16584&&sourceDef16584.type||'').toLowerCase()!=="vector")continue;
      let features16584=[];try{features16584=mp16584.querySourceFeatures(sourceId16584,{sourceLayer:"water"})||[]}catch(_){features16584=[]}
      if(!features16584.length)continue;sourceCount16584++;featureCount16584+=features16584.length;
      for(const f16584 of features16584){const g16584=f16584&&f16584.geometry;if(!g16584)continue;if(g16584.type==="Polygon")addPart16584(g16584.coordinates);else if(g16584.type==="MultiPolygon")for(const p16584 of (g16584.coordinates||[]))addPart16584(p16584)}
    }
    return {scale:scale16584,bins:bins16584,featureCount:featureCount16584,partCount:partCount16584,sourceCount:sourceCount16584};
  }

  function earthlineRegionalPointValid16584(hy16584,ll16584){
    if(!hy16584||!hy16584.validityMask16584)return true;
    const g16584=llGrid(hy16584,ll16584),
          x16584=Math.max(0,Math.min(hy16584.w-1,Math.round(g16584.x))),
          y16584=Math.max(0,Math.min(hy16584.h-1,Math.round(g16584.y)));
    if(!hy16584.validityMask16584[y16584*hy16584.w+x16584])return false;
    const waterParts16584=Array.isArray(hy16584.waterParts16584)?hy16584.waterParts16584:[];
    if(waterParts16584.length&&ll16584&&Number.isFinite(Number(ll16584[0]))&&Number.isFinite(Number(ll16584[1]))){
      const lng16584=Number(ll16584[0]),lat16584=Number(ll16584[1]);
      for(const part16584 of waterParts16584){
        if(!part16584||!part16584.bbox||!part16584.rings)continue;
        if(lng16584<part16584.bbox[0]||lng16584>part16584.bbox[2]||lat16584<part16584.bbox[1]||lat16584>part16584.bbox[3])continue;
        if(earthlinePointInPolygon16584(lng16584,lat16584,part16584.rings))return false;
      }
      const styleIndex16584=hy16584.styleWaterIndex16584,scale16584=Number(styleIndex16584&&styleIndex16584.scale)||4;
      if(styleIndex16584&&styleIndex16584.bins){
        const candidates16584=styleIndex16584.bins[Math.floor(lng16584*scale16584)+':'+Math.floor(lat16584*scale16584)]||[];
        for(const part16584 of candidates16584){
          if(!part16584||!part16584.bbox||!part16584.rings)continue;
          if(lng16584<part16584.bbox[0]||lng16584>part16584.bbox[2]||lat16584<part16584.bbox[1]||lat16584>part16584.bbox[3])continue;
          if(earthlinePointInPolygon16584(lng16584,lat16584,part16584.rings))return false;
        }
      }
    }
    return true;
  }`;
if(!s.includes(oldPoint))throw new Error('current 16584 point-validity block not found');
s=s.replace(oldPoint,newPoint);

const oldFlow=`    let flows=makeFlows(hy);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · FLOWS COMPLETE',runToken);await wait(0);`;
const newFlow=`    if(!focusMode&&hy&&hy.validityMask16584){
      hy.styleWaterIndex16584=earthlineLoadedStyleWaterIndex16584(map());
      window.EARTHLINE_STYLE_WATER_INDEX_16584={build:'EARTHLINE 16584',runToken,featureCount:Number(hy.styleWaterIndex16584.featureCount||0),partCount:Number(hy.styleWaterIndex16584.partCount||0),sourceCount:Number(hy.styleWaterIndex16584.sourceCount||0),binCount:Object.keys(hy.styleWaterIndex16584.bins||{}).length,at:new Date().toISOString()};
    }
    let flows=makeFlows(hy);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · FLOWS COMPLETE',runToken);await wait(0);`;
if(!s.includes(oldFlow))throw new Error('governed makeFlows call not found');
s=s.replace(oldFlow,newFlow);

fs.writeFileSync(path,s);
console.log('Updated existing 16584 flow-validity owner with loaded vector-water shoreline index; no new renderer/listener/lifecycle owner.');
