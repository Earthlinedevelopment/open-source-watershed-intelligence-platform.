import fs from 'node:fs';
const path='index.html';
let s=fs.readFileSync(path,'utf8');
const oldLake='const EARTHLINE_NE50_LAKES_16584="https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ace5fed0eaf3c6c03c951e75b439ba8fffbc218e/geojson/ne_50m_lakes.geojson";';
const newLake='const EARTHLINE_NE50_LAKES_16584="https://raw.githubusercontent.com/nvkelso/natural-earth-vector/ace5fed0eaf3c6c03c951e75b439ba8fffbc218e/geojson/ne_10m_lakes.geojson"; /* shared global shoreline evidence; land remains 1:50m */';
if(!s.includes(oldLake))throw new Error('pinned 1:50m lake source not found');
s=s.replace(oldLake,newLake);

const fnMarker='function earthlineFinalWaterClip16584(hy16584,flows16584,mp16584,runToken16584){';
const fnStart=s.indexOf(fnMarker);if(fnStart<0)throw new Error('final water owner missing');
let p=s.indexOf('{',fnStart),depth=0,fnEnd=-1;for(;p<s.length;p++){if(s[p]==='{')depth++;else if(s[p]==='}'){depth--;if(depth===0){fnEnd=p+1;break;}}}if(fnEnd<0)throw new Error('final water owner parse failed');
let fn=s.slice(fnStart,fnEnd);

const startAnchor='const scale16584=4,bins16584=Object.create(null),seen16584=new Set();';
if(!fn.includes(startAnchor))throw new Error('style index anchor missing');
fn=fn.replace(startAnchor,'const scale16584=4,bins16584=Object.create(null),seen16584=new Set(),styleShoreParts16584=[];');
const partAnchor='const part16584={rings:rings16584,bbox:[x016584,y016584,x116584,y116584]};';
if(!fn.includes(partAnchor))throw new Error('style water part anchor missing');
fn=fn.replace(partAnchor,partAnchor+'\n      styleShoreParts16584.push(part16584);');

const evidenceAnchor='    const hasGrid16584=!!hy16584.validityMask16584;\n    const evidenceReady16584=hasGrid16584||styleCoverageReady16584;';
if(!fn.includes(evidenceAnchor))throw new Error('evidence anchor missing');
const adaptive=`    const hasGrid16584=!!hy16584.validityMask16584;\n    const evidenceReady16584=hasGrid16584||styleCoverageReady16584;\n    /* Shared global shoreline uncertainty: half of this run's local DEM-cell diagonal.\n       No jurisdiction-specific distance is used. Natural Earth 1:10m lakes and any\n       live style surface-water polygons feed the same final publication validator. */\n    const shoreBufferKm16584=(()=>{\n      const b16584=Array.isArray(hy16584.bounds)?hy16584.bounds:null,w16584=Math.max(2,Number(hy16584.w)||96),h16584=Math.max(2,Number(hy16584.h)||96);\n      if(!b16584||b16584.length!==4)return 0;\n      const R16584=6371.0088,r16584=Math.PI/180,mid16584=(Number(b16584[1])+Number(b16584[3]))/2,\n            hav16584=(a,b)=>{const p1=a[1]*r16584,p2=b[1]*r16584,dp=(b[1]-a[1])*r16584,dl=(b[0]-a[0])*r16584,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R16584*Math.asin(Math.min(1,Math.sqrt(q)))};\n      const dx16584=hav16584([Number(b16584[0]),mid16584],[Number(b16584[0])+(Number(b16584[2])-Number(b16584[0]))/(w16584-1),mid16584]),\n            dy16584=hav16584([Number(b16584[0]),mid16584],[Number(b16584[0]),mid16584+(Number(b16584[3])-Number(b16584[1]))/(h16584-1)]);\n      return .5*Math.hypot(dx16584,dy16584);\n    })();\n    const shoreDistanceKm16584=p16584=>{\n      if(!(shoreBufferKm16584>0)||!finitePoint16584(p16584))return Infinity;\n      const lng16584=Number(p16584[0]),lat16584=Number(p16584[1]),R16584=6371.0088,r16584=Math.PI/180,cos16584=Math.max(.15,Math.cos(lat16584*r16584)),\n            padLat16584=shoreBufferKm16584/111,padLng16584=shoreBufferKm16584/(111*cos16584),\n            xy16584=q16584=>[R16584*Number(q16584[0])*r16584*cos16584,R16584*Number(q16584[1])*r16584];\n      let best16584=Infinity;\n      const dseg16584=(q16584,a16584,b16584)=>{const Q=xy16584(q16584),A=xy16584(a16584),B=xy16584(b16584),dx=B[0]-A[0],dy=B[1]-A[1],l2=dx*dx+dy*dy;if(l2<1e-20)return Math.hypot(Q[0]-A[0],Q[1]-A[1]);let t=((Q[0]-A[0])*dx+(Q[1]-A[1])*dy)/l2;t=Math.max(0,Math.min(1,t));return Math.hypot(Q[0]-(A[0]+t*dx),Q[1]-(A[1]+t*dy))};\n      const parts16584=[...(Array.isArray(hy16584.waterParts16584)?hy16584.waterParts16584:[]),...styleShoreParts16584];\n      for(const part16584 of parts16584){\n        if(!part16584||!part16584.bbox||!part16584.rings)continue;const bb16584=part16584.bbox;\n        if(lng16584<bb16584[0]-padLng16584||lng16584>bb16584[2]+padLng16584||lat16584<bb16584[1]-padLat16584||lat16584>bb16584[3]+padLat16584)continue;\n        for(const ring16584 of part16584.rings||[])for(let j16584=1;j16584<ring16584.length;j16584++){const d16584=dseg16584(p16584,ring16584[j16584-1],ring16584[j16584]);if(d16584<best16584)best16584=d16584;if(best16584<=shoreBufferKm16584)return best16584;}\n      }\n      return best16584;\n    };`;
fn=fn.replace(evidenceAnchor,adaptive);

const pointAnchor='    const pointValid16584=p16584=>{\n      if(!finitePoint16584(p16584))return false;';
if(!fn.includes(pointAnchor))throw new Error('point validator anchor missing');
fn=fn.replace(pointAnchor,pointAnchor+'\n      if(shoreDistanceKm16584(p16584)<=shoreBufferKm16584)return false;');

const auditAnchor='      inputLines:inputLines16584,outputLines:outputLines16584,clippedLines:clippedLines16584,droppedLines:droppedLines16584,\n      failClosedNoEvidence:!evidenceReady16584,at:new Date().toISOString()';
if(!fn.includes(auditAnchor))throw new Error('audit anchor missing');
fn=fn.replace(auditAnchor,"      inputLines:inputLines16584,outputLines:outputLines16584,clippedLines:clippedLines16584,droppedLines:droppedLines16584,\n      shorelineEvidence:'Natural Earth 1:10m lakes + live surface-water polygons',shoreBufferRule:'half-local-DEM-cell-diagonal',shoreBufferKm:Number(shoreBufferKm16584.toFixed(3)),\n      failClosedNoEvidence:!evidenceReady16584,at:new Date().toISOString()");

s=s.slice(0,fnStart)+fn+s.slice(fnEnd);
fs.writeFileSync(path,s);
console.log('MANTRA38_GLOBAL_SHORELINE_PATCH '+JSON.stringify({patched:true,jurisdictionSpecific:false,waterEvidence:'Natural Earth 1:10m lakes + live surface-water polygons',bufferRule:'half-local-DEM-cell-diagonal',owner:'earthlineFinalWaterClip16584'}));
