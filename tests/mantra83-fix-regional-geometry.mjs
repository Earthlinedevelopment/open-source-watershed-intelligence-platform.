import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';
let s=readFileSync(p,'utf8');

const changes=[
[
"const half=Math.max(10,Math.min(52,Math.floor(coords.length*.18))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);\n      const raw=coords.slice(start,end);if(raw.length<8)return null;\n      const segment=chaikin(raw,2,false);if(segment.length<8)return null;",
"const half=Math.max(5,Math.min(10,Math.floor(coords.length*.07))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);\n      const raw=coords.slice(start,end);if(raw.length<8)return null;\n      const segment=raw;if(segment.length<8)return null;"
],
[
"const stride=Math.max(1,Math.floor(segment.length/22));let valid=0,sumSlope=0,sumAcc=0,maxAcc=0,anchor=null;\n      for(let k=1;k<segment.length-1;k+=stride){\n        const g=llGrid(hy,segment[k]),x=Math.max(1,Math.min(hy.w-2,Math.round(g.x))),y=Math.max(1,Math.min(hy.h-2,Math.round(g.y))),i=y*hy.w+x;\n        const slope=hy.slope[i],acc=hy.acc[i],minSlope=relaxed?.05:.20,maxSlope=4;\n        if(!Number.isFinite(slope)||slope<minSlope||slope>maxSlope||acc>=channel)continue;\n        valid++;sumSlope+=slope;sumAcc+=acc;maxAcc=Math.max(maxAcc,acc);if(!anchor)anchor={x,y};\n      }\n      if(valid<(relaxed?1:2)||!anchor)return null;",
"let valid=0,sumSlope=0,sumAcc=0,maxAcc=0,anchor=null;\n      for(let k=1;k<segment.length-1;k++){\n        const g=llGrid(hy,segment[k]),x=Math.max(1,Math.min(hy.w-2,Math.round(g.x))),y=Math.max(1,Math.min(hy.h-2,Math.round(g.y))),i=y*hy.w+x;\n        const slope=hy.slope[i],acc=hy.acc[i],minSlope=0,maxSlope=4;\n        if(!Number.isFinite(slope)||slope<minSlope||slope>maxSlope||!Number.isFinite(acc)||acc>=channel)return null;\n        valid++;sumSlope+=slope;sumAcc+=acc;maxAcc=Math.max(maxAcc,acc);if(!anchor)anchor={x,y};\n      }\n      if(valid<2||!anchor)return null;"
],
[
"if(!focusMode||preferredEligibleCount16539<36){",
"if(focusMode||preferredEligibleCount16539<36){"
]
];

for(const [oldv,newv] of changes){
  if(s.includes(oldv))s=s.replace(oldv,newv);
  else if(!s.includes(newv))throw new Error('geometry owner not found');
}
writeFileSync(p,s);
console.log('M83_REGIONAL_GEOMETRY_CORRECTION_APPLIED');
