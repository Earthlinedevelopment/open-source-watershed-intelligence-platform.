import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';
let src=readFileSync(p,'utf8');

const desiredHead="const half=Math.max(5,Math.min(10,Math.floor(coords.length*.07))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);\n      const raw=coords.slice(start,end);if(raw.length<8)return null;\n      const segment=raw;if(segment.length<8)return null;";
const currentHead="const half=Math.max(8,Math.min(24,Math.floor(coords.length*.10))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);\n      const raw=coords.slice(start,end);if(raw.length<10)return null;\n      const segment=raw;if(segment.length<10)return null;";
const legacyHead="const half=Math.max(10,Math.min(52,Math.floor(coords.length*.18))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);\n      const raw=coords.slice(start,end);if(raw.length<10)return null;\n      const segment=chaikin(raw,2,false);if(segment.length<10)return null;";

if(src.includes(currentHead))src=src.replace(currentHead,desiredHead);
else if(src.includes(legacyHead))src=src.replace(legacyHead,desiredHead);
else if(!src.includes(desiredHead))throw new Error('Regional segment geometry owner not found');

const legacyScan="const stride=Math.max(1,Math.floor(segment.length/22));let valid=0,sumSlope=0,sumAcc=0,maxAcc=0,anchor=null;\n      for(let k=1;k<segment.length-1;k+=stride){\n        const g=llGrid(hy,segment[k]),x=Math.max(1,Math.min(hy.w-2,Math.round(g.x))),y=Math.max(1,Math.min(hy.h-2,Math.round(g.y))),i=y*hy.w+x;\n        const slope=hy.slope[i],acc=hy.acc[i],minSlope=relaxed?.05:.20,maxSlope=4;\n        if(!Number.isFinite(slope)||slope<minSlope||slope>maxSlope||acc>=channel)continue;\n        valid++;sumSlope+=slope;sumAcc+=acc;maxAcc=Math.max(maxAcc,acc);if(!anchor)anchor={x,y};\n      }\n      if(valid<(relaxed?1:2)||!anchor)return null;";
const desiredScan="let valid=0,sumSlope=0,sumAcc=0,maxAcc=0,anchor=null;\n      for(let k=1;k<segment.length-1;k++){\n        const g=llGrid(hy,segment[k]),x=Math.max(1,Math.min(hy.w-2,Math.round(g.x))),y=Math.max(1,Math.min(hy.h-2,Math.round(g.y))),i=y*hy.w+x;\n        const slope=hy.slope[i],acc=hy.acc[i],minSlope=0,maxSlope=4;\n        if(!Number.isFinite(slope)||slope<minSlope||slope>maxSlope||!Number.isFinite(acc)||acc>=channel)return null;\n        valid++;sumSlope+=slope;sumAcc+=acc;maxAcc=Math.max(maxAcc,acc);if(!anchor)anchor={x,y};\n      }\n      if(valid<2||!anchor)return null;";
if(src.includes(legacyScan))src=src.replace(legacyScan,desiredScan);
else if(!src.includes(desiredScan))throw new Error('Regional full-segment eligibility owner not found');

const legacyRelax="if(!focusMode||preferredEligibleCount16539<36){";
const desiredRelax="if(focusMode||preferredEligibleCount16539<36){";
if(src.includes(legacyRelax))src=src.replace(legacyRelax,desiredRelax);
else if(!src.includes(desiredRelax))throw new Error('Regional relaxed-pool owner not found');

writeFileSync(p,src);
console.log('M83_REGIONAL_GEOMETRY_CORRECTION_APPLIED');
