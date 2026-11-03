import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync('index.html','utf8');
const start=html.indexOf('  const earthlineRingBinCacheM94=');
const end=html.indexOf('  function earthlinePointInPolygon16584(',start);
assert.ok(start>0&&end>start,'The exact ring-index owner must exist');
const ctx={};
vm.runInNewContext(html.slice(start,end)+'\n globalThis.indexedRing=earthlinePointInRing16584;',ctx);
const indexed=ctx.indexedRing;
assert.equal(typeof indexed,'function');
function baseline(x16584,y16584,ring16584){
  if(!Array.isArray(ring16584)||ring16584.length<3)return false;
  let inside16584=false;
  for(let i16584=0,j16584=ring16584.length-1;i16584<ring16584.length;j16584=i16584++){
    const a16584=ring16584[i16584]||[],b16584=ring16584[j16584]||[];
    const xi16584=Number(a16584[0]),yi16584=Number(a16584[1]),
          xj16584=Number(b16584[0]),yj16584=Number(b16584[1]);
    if(![xi16584,yi16584,xj16584,yj16584].every(Number.isFinite))continue;
    if(((yi16584>y16584)!==(yj16584>y16584))&&
       (x16584<(xj16584-xi16584)*(y16584-yi16584)/((yj16584-yi16584)||1e-15)+xi16584))
      inside16584=!inside16584;
  }
  return inside16584;
}
let seed=4394001;
const rand=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
let total=0;
function check(ring,x,y){
  const expected=baseline(x,y,ring),observed=indexed(x,y,ring);
  assert.equal(observed,expected,'Ray crossing mismatch at '+JSON.stringify({x,y,size:ring?.length}));
  total++;
}
const shapes=[
  [[0,0],[5,0],[5,5],[0,5],[0,0]],
  [[-179,-85],[179,-85],[179,85],[-179,85],[-179,-85]],
  [[-93,40],[-90,40],[-90,44],[-93,44],[-93,40]],
  [[-10,-10],[10,-10],[10,10],[-10,10],[-10,-10],null],
  [[0,0],[0,0],[2,2],[4,4],[4,0],[0,0]],
  [[-120,0],[-120,50],[120,50],[120,0],[-120,0]],
];
for(let k=0;k<90;k++){
  const cx=rand()*340-170,cy=rand()*150-75,rx=rand()*8+.1,ry=rand()*8+.1,n=12+Math.floor(rand()*110),ring=[];
  for(let i=0;i<n;i++){
    const a=i*2*Math.PI/n;
    ring.push([cx+rx*Math.cos(a)*(0.9+0.2*rand()),cy+ry*Math.sin(a)*(0.9+0.2*rand())]);
  }
  if(k%7===0)ring.push(ring[0]);
  if(k%9===0)ring.push([NaN,4]);
  shapes.push(ring);
}
for(const ring of shapes){
  for(let k=0;k<100;k++)check(ring,rand()*360-180,rand()*180-90);
  for(const p of ring){
    if(!Array.isArray(p)||!Number.isFinite(p[0])||!Number.isFinite(p[1]))continue;
    check(ring,p[0],p[1]);check(ring,p[0]+1e-10,p[1]+1e-10);
    check(ring,p[0]-1e-10,p[1]-1e-10);
  }
  for(const x of [-Infinity,-180,0,180,Infinity,NaN])
    for(const y of [-Infinity,-90,0,90,Infinity,NaN])check(ring,x,y);
}
const dense=[];
for(let i=0;i<20000;i++){const a=i*2*Math.PI/20000;dense.push([-96+1.2*Math.cos(a),40+1.6*Math.sin(a)])}
dense.push(dense[0]);
for(let i=0;i<50;i++)check(dense,-98+rand()*4,38+rand()*4);
console.log('MANTRA94_EXACT_RING_PARITY_PASS cases='+total+' rings='+shapes.length+' denseVertices='+dense.length);
