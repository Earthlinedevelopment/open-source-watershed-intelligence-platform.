import assert from 'node:assert/strict';
import {candidateEligible,candidateScore,selectSwales} from '../science/mantra83-swales.mjs';

const mk=(id,x,slope,extra={})=>({
  id,metersPerGrid:1,anchor:{x,y:10},
  samples:[0,1,2,3,4].map(k=>({x:x+k,y:10,slopePct:slope,flowScore:.7,rechargeScore:.8,insideBoundary:true,...extra}))
});

assert.equal(candidateEligible(mk('ok',0,4)),true);
assert.equal(candidateEligible(mk('steep',0,4.01)),false);
assert.equal(candidateEligible(mk('road',0,3,{roadOrDriveway:true})),false);
assert.equal(candidateEligible(mk('forest',0,3,{canopyKnown:true,canopyScore:.5})),false);
assert.ok(candidateScore(mk('ok',0,2))>candidateScore(mk('ok2',0,4)));

const c=[
  mk('a',0,2),
  mk('b',3,2),
  mk('c',8,2),
  mk('d',15,5)
];
const s=selectSwales(c,{maxCount:10});
assert.deepEqual(s.map(x=>x.id),['a','c']);
assert.ok(s.every(x=>x.maxSlopePct===4));

console.log('MANTRA83_SWALE_CORE_PASS '+JSON.stringify({selected:s.map(x=>x.id)}));
