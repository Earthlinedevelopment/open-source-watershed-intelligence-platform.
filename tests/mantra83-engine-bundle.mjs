import assert from 'node:assert/strict';
import {buildScienceBundle} from '../science/mantra83-engine.mjs';

const w=20,h=20,z=new Float64Array(w*h);
for(let y=0;y<h;y++)for(let x=0;x<w;x++)z[y*w+x]=100-y*.02+x*.003;

const candidates=[
  {id:'safe',metersPerGrid:1,anchor:{x:5,y:5},samples:[{x:5,y:5,i:105,slopePct:3,flowScore:.8,rechargeScore:.8}]},
  {id:'steep',metersPerGrid:1,anchor:{x:12,y:5},samples:[{x:12,y:5,i:112,slopePct:5,flowScore:1,rechargeScore:1}]}
];

const input={
  runId:'run-1',mode:'property',target:{lat:44,lng:-72},extent:[-72.1,43.9,-71.9,44.1],
  dem:{source:'test',resolutionM:5,width:w,height:h,elevation:z},
  cellXM:5,cellYM:5,
  aquiferFallback:.5,soilFallback:.5,
  annualPrecipIn:30,
  swaleCandidates:candidates,
  exclusions:{status:'verified'},
  waterPaths:[],contours:[],
  aquiferEvidence:{status:'screened'},
  elderEvidence:{status:'screened',rechargeWeight:0},
  coverage:{status:'complete'}
};

const a=buildScienceBundle(input);
const b=buildScienceBundle(structuredClone(input));

assert.equal(a.engineVersion,'m83-unified-engine-1');
assert.equal(a.rules.maxSwaleSlopePct,4);
assert.deepEqual(a.swales.map(x=>x.id),['safe']);
assert.deepEqual(Array.from(a.hydrology.to),Array.from(b.hydrology.to));
assert.deepEqual(Array.from(a.recharge.grid),Array.from(b.recharge.grid));
assert.equal(JSON.stringify(a.swales),JSON.stringify(b.swales));
assert.ok(Object.isFrozen(a));
assert.ok(Object.isFrozen(a.rules));
assert.equal(a.elder.rechargeWeight,0);

console.log('MANTRA83_ENGINE_BUNDLE_PASS '+JSON.stringify({swales:a.swales.length,engine:a.engineVersion}));
