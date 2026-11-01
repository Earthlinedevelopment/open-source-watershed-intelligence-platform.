import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';
let src=readFileSync(p,'utf8');

const desiredHead="const half=Math.max(5,Math.min(10,Math.floor(coords.length*.07))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);\n      const raw=coords.slice(start,end);if(raw.length<2)return null;\n      const rawCenter=Math.max(0,Math.min(raw.length-1,center-start));\n      const distM=(a,b)=>{const R=6371008.8,p1=Number(a[1])*Math.PI/180,p2=Number(b[1])*Math.PI/180,dp=(Number(b[1])-Number(a[1]))*Math.PI/180,dl=(Number(b[0])-Number(a[0]))*Math.PI/180,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)))};\n      let left=rawCenter,right=rawCenter,leftM=0,rightM=0;\n      while(left>0){const d=distM(raw[left],raw[left-1]);if(leftM+d>8000)break;left--;leftM+=d}\n      while(right<raw.length-1){const d=distM(raw[right],raw[right+1]);if(rightM+d>8000)break;right++;rightM+=d}\n      if(left===right){if(right<raw.length-1)right++;else if(left>0)left--}\n      const segment=raw.slice(left,right+1);if(segment.length<2)return null;";
const currentHead="const half=Math.max(5,Math.min(10,Math.floor(coords.length*.07))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);\n      const raw=coords.slice(start,end);if(raw.length<8)return null;\n      const segment=raw;if(segment.length<8)return null;";
const legacyHead="const half=Math.max(10,Math.min(52,Math.floor(coords.length*.18))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);\n      const raw=coords.slice(start,end);if(raw.length<10)return null;\n      const segment=chaikin(raw,2,false);if(segment.length<10)return null;";

if(src.includes(currentHead))src=src.replace(currentHead,desiredHead);
else if(src.includes(legacyHead))src=src.replace(legacyHead,desiredHead);
else if(!src.includes(desiredHead))throw new Error('Regional segment geometry owner not found');

const legacyScan="const stride=Math.max(1,Math.floor(segment.length/22));let valid=0,sumSlope=0,sumAcc=0,maxAcc=0,anchor=null;\n      for(let k=1;k<segment.length-1;k+=stride){\n        const g=llGrid(hy,segment[k]),x=Math.max(1,Math.min(hy.w-2,Math.round(g.x))),y=Math.max(1,Math.min(hy.h-2,Math.round(g.y))),i=y*hy.w+x;\n        const slope=hy.slope[i],acc=hy.acc[i],minSlope=relaxed?.05:.20,maxSlope=4;\n        if(!Number.isFinite(slope)||slope<minSlope||slope>maxSlope||acc>=channel)continue;\n        valid++;sumSlope+=slope;sumAcc+=acc;maxAcc=Math.max(maxAcc,acc);if(!anchor)anchor={x,y};\n      }\n      if(valid<(relaxed?1:2)||!anchor)return null;";
const desiredScan="let valid=0,sumSlope=0,sumAcc=0,maxAcc=0,anchor=null;\n      for(let k=0;k<segment.length;k++){\n        const g=llGrid(hy,segment[k]),x=Math.max(1,Math.min(hy.w-2,Math.round(g.x))),y=Math.max(1,Math.min(hy.h-2,Math.round(g.y))),i=y*hy.w+x;\n        const slope=hy.slope[i],acc=hy.acc[i],minSlope=0,maxSlope=4;\n        if(!Number.isFinite(slope)||slope<minSlope||slope>maxSlope||!Number.isFinite(acc)||acc>=channel)return null;\n        valid++;sumSlope+=slope;sumAcc+=acc;maxAcc=Math.max(maxAcc,acc);if(!anchor)anchor={x,y};\n      }\n      if(valid<2||!anchor)return null;";
if(src.includes(legacyScan))src=src.replace(legacyScan,desiredScan);
else if(!src.includes(desiredScan))throw new Error('Regional full-segment eligibility owner not found');

const lineOld="const linePx16632=lineLengthPixels(hy,segment);let minLinePx16632=focusMode?10:4;";
const lineNew="const linePx16632=lineLengthPixels(hy,segment);let minLinePx16632=focusMode?10:2;";
if(src.includes(lineOld))src=src.replace(lineOld,lineNew); else if(!src.includes(lineNew))throw new Error('Regional line minimum owner not found');

const legacyRelax="if(!focusMode||preferredEligibleCount16539<36){";
const desiredRelax="if(focusMode||preferredEligibleCount16539<36){";
if(src.includes(legacyRelax))src=src.replace(legacyRelax,desiredRelax);
else if(!src.includes(desiredRelax))throw new Error('Regional relaxed-pool owner not found');

writeFileSync(p,src);
console.log('M83_REGIONAL_GEOMETRY_CORRECTION_APPLIED');
