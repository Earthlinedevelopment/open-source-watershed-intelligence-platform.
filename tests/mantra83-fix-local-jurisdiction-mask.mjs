import {readFileSync,writeFileSync} from 'node:fs';
const p='index.html';
let s=readFileSync(p,'utf8');

const oldScreen="function screenJurisdictionCandidate16539(candidate16539){\n      if(focusMode||!jurisdictionGeometry16539)return candidate16539;";
const fastScreen="function screenJurisdictionCandidate16539(candidate16539){\n      if(focusMode||!jurisdictionGeometry16539)return candidate16539;\n      if(hy&&hy.earthlineLocalJurisdictionMask16539){\n        const seg16539=Array.isArray(candidate16539&&candidate16539.segment)?candidate16539.segment:[];\n        const mask16539=hy.earthlineLocalJurisdictionMask16539;\n        const inside16539=p16539=>{const g16539=llGrid(hy,p16539);if(!g16539||!Number.isFinite(g16539.x)||!Number.isFinite(g16539.y))return false;const x16539=Math.max(0,Math.min(hy.w-1,Math.round(g16539.x))),y16539=Math.max(0,Math.min(hy.h-1,Math.round(g16539.y)));return mask16539[y16539*hy.w+x16539]===1;};\n        for(let i16539=0;i16539<seg16539.length;i16539++){if(!inside16539(seg16539[i16539]))return null;if(i16539){const a16539=seg16539[i16539-1],b16539=seg16539[i16539];for(const t16539 of [.25,.5,.75])if(!inside16539([a16539[0]+(b16539[0]-a16539[0])*t16539,a16539[1]+(b16539[1]-a16539[1])*t16539]))return null;}}\n        if(seg16539.length<2)return null;const mid16539=seg16539[Math.floor((seg16539.length-1)/2)],grid16539=llGrid(hy,mid16539);if(!grid16539)return null;return Object.assign({},candidate16539,{x:Math.max(1,Math.min(hy.w-2,Math.round(grid16539.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(grid16539.y))),jurisdiction_screened:true,jurisdiction_mask_screened:true});\n      }";

const oldH31="const h16731=await hydrology(d16731,g16731.mask);h16731.outsideLandMask16632=g16731.outsideLandMask16632||null;";
const newH31="const h16731=await hydrology(d16731,g16731.mask);h16731.earthlineLocalJurisdictionMask16539=g16731.mask;h16731.outsideLandMask16632=g16731.outsideLandMask16632||null;";
const oldH41="const h16741=await hydrology(d16741,g16741.mask);h16741.outsideLandMask16632=g16741.outsideLandMask16632||null;";
const newH41="const h16741=await hydrology(d16741,g16741.mask);h16741.earthlineLocalJurisdictionMask16539=g16741.mask;h16741.outsideLandMask16632=g16741.outsideLandMask16632||null;";

for(const [a,b] of [[oldScreen,fastScreen],[oldH31,newH31],[oldH41,newH41]]){
  if(s.includes(b))continue;
  if(!s.includes(a))throw new Error('live owner missing: '+a.slice(0,100));
  s=s.replace(a,b);
}
writeFileSync(p,s);
console.log('M83_LOCAL_JURISDICTION_MASK_APPLIED');
