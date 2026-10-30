import assert from 'node:assert/strict';
import {hydrology,FILL_EPSILON_M} from '../science/mantra83-hydrology.mjs';

const w=30,h=30,z=new Float64Array(w*h);
for(let y=0;y<h;y++)for(let x=0;x<w;x++)z[y*w+x]=200-y*.05+x*.01+Math.sin(x*.71+y*.37)*.03;
for(let y=10;y<15;y++)for(let x=12;x<18;x++)z[y*w+x]-=.08;

const a=hydrology(z,w,h,{cellXM:5,cellYM:5});
const b=hydrology(z,w,h,{cellXM:5,cellYM:5});
assert.equal(FILL_EPSILON_M,.0008);
assert.deepEqual(Array.from(a.to),Array.from(b.to));
assert.deepEqual(Array.from(a.accumulation),Array.from(b.accumulation));

const c=hydrology(z,w,h,{cellXM:5,cellYM:5,epsilonM:.01});
let different=0,maxAccumulationDifference=0;
for(let i=0;i<a.to.length;i++){
  if(a.to[i]!==c.to[i])different++;
  maxAccumulationDifference=Math.max(maxAccumulationDifference,Math.abs(a.accumulation[i]-c.accumulation[i]));
}
assert.ok(different>0);
console.log('MANTRA83_HYDROLOGY_PASS '+JSON.stringify({cells:a.to.length,different,maxAccumulationDifference,fillEpsilonM:FILL_EPSILON_M}));
