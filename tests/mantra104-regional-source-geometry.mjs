import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync('index.html','utf8');
const owner=html.indexOf('  function makeSwales(hy,contours,focusMode=false){');
const guard=html.indexOf('  function earthlineWormGeometryPassRegional101(points){',owner);
const sampler=html.indexOf('    function sampleSegment(coords,center,relaxed){',guard);
const end=html.indexOf('    for(const f of lines){',sampler);
assert.ok(owner>0&&guard>owner&&sampler>guard&&end>sampler,'Expected active Regional source sampler');
const fragment=html.slice(sampler,end);
assert.ok(fragment.includes('halfM104=1700'), 'Bound source corridor length');
assert.ok(fragment.includes('slope>4'), 'Enforce the <=4% slope acceptance across the entire corridor');
assert.ok(fragment.includes('flowCells<1'), 'Require positive upslope-flow evidence');
assert.ok(!fragment.includes('chaikin('), 'No spline or smoothing may alter swale source geometry');
assert.ok(html.includes('corridor_max_slope_pct:Number(c.maxSlopeM104.toFixed(2))'));
assert.ok(html.includes('corridor_length_m:Number(c.lengthM104.toFixed(1))'));

const w=240,h=240,bounds=[0,0,2.4,2.4],N=w*h;
const hy={w,h,bounds,cellX:100,cellY:100,
 slope:new Float32Array(N).fill(2),
 acc:new Float32Array(N).fill(3),
 validityMask16584:new Uint8Array(N).fill(1)};
const ll=(x,y)=>[bounds[0]+x/(w-1)*(bounds[2]-bounds[0]),
 bounds[3]-y/(h-1)*(bounds[3]-bounds[1])];
const llGrid=(h,p)=>({x:(p[0]-h.bounds[0])/(h.bounds[2]-h.bounds[0])*(h.w-1),
 y:(h.bounds[3]-p[1])/(h.bounds[3]-h.bounds[1])*(h.h-1)});
const cleanLine=(coords)=>{
 const out=[];for(const p of coords){const q=out[out.length-1];
  if(!q||Math.hypot(q[0]-p[0],q[1]-p[1])>1e-10)out.push(p);
 }return out;
};
const ctx={hy,llGrid,cleanLine,channel:100,accLow:1,accMid:4,accHigh:12};
vm.runInNewContext(html.slice(guard,sampler)+fragment+
 '\n globalThis.sample104=sampleSegment;',ctx,{timeout:3000});

const coords=Array.from({length:100},(_,i)=>ll(16+i*2,120));
let item=ctx.sample104(coords,49,false);
assert.ok(item&&item.segment.length>=10,'A safely supported contour corridor remains published');
assert.ok(item.lengthM104<=3400.01&&item.lengthM104>=160,'Corridor stays in the physical length envelope');
assert.ok(item.maxSlopeM104<=4&&item.flowCellsM104>0,'Physical gate reports actual corridor support');
assert.ok(item.segment.every(p=>Math.abs(llGrid(hy,p).y-120)<1e-6),'No invented contour excursion');
assert.ok(item.segment.some(p=>Math.abs(llGrid(hy,p).x-114)<0.02),'Actual centerline point is retained');

const center=llGrid(hy,coords[49]),i0=Math.round(center.y)*w+Math.round(center.x);
hy.slope[i0]=4.01;
assert.equal(ctx.sample104(coords,49,false),null,'One >4% source cell blocks the entire candidate');
hy.slope[i0]=0;
item=ctx.sample104(coords,49,false);
assert.ok(item,'Zero-slope terrain is allowed, not incorrectly excluded');
hy.acc[i0]=200;
assert.equal(ctx.sample104(coords,49,false),null,'Major water cell blocks the candidate');
hy.acc[i0]=1;
hy.acc.fill(1);
assert.equal(ctx.sample104(coords,49,false),null,'No upslope runoff support blocks a corridor');
hy.acc.fill(3);
hy.validityMask16584[i0]=0;
assert.equal(ctx.sample104(coords,49,false),null,'No-build / invalid land cell blocks a corridor');
hy.validityMask16584[i0]=1;
const curl=[[98,119],[115,119],[135,119],[135,135],[101,135],[101,120],
 [131,120],[131,132],[105,132],[105,122],[130,122]].map(([x,y])=>ll(x,y));
assert.equal(ctx.sample104(curl,5,false),null,'Coiled contour candidates fail closed');
console.log('MANTRA104_REGIONAL_SOURCE_GEOMETRY_PASS: locally bounded, on-source, <=4% every sample, positive runoff, no folded corridors');
