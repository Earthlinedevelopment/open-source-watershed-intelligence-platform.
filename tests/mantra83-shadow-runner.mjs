import assert from 'node:assert/strict';
import {legacyToScienceInput} from '../science/mantra83-legacy-adapter.mjs';
import {RunCoordinator} from '../science/mantra83-coordinator.mjs';
import {compareRuns} from '../science/mantra83-shadow.mjs';

const w=20,h=18,z=new Float64Array(w*h);
for(let y=0;y<h;y++)for(let x=0;x<w;x++)z[y*w+x]=200-y*.02+x*.003;
const model={
  h:z,inP:new Uint8Array(w*h).fill(1),cellM:5,
  loc:{lat:44,lng:-72},bounds:[-72.1,43.9,-71.9,44.1],
  swales:[
    {id:'legacy-safe',maxSlopePct:3,samples:[{x:4,y:4,i:84,slopePct:3,flowScore:.8,rechargeScore:.8}]},
    {id:'legacy-steep',maxSlopePct:33,samples:[{x:12,y:4,i:92,slopePct:33,flowScore:.9,rechargeScore:.9}]}
  ]
};
const displayed={runToken:'real-shape-1',tier:'property',target:{lat:44,lng:-72},bounds:[-72.1,43.9,-71.9,44.1]};
const input=legacyToScienceInput({displayed,model,gw:w,gh:h});
const c=new RunCoordinator();
const modern=await c.run(input);
assert.equal(modern.status,'published');

const diff=compareRuns({
  legacy:{runId:displayed.runToken,target:displayed.target,swales:model.swales},
  newRun:modern
});
assert.equal(diff.samePublicationIdentity,true);
assert.equal(diff.legacyViolatesFourPct,true);
assert.equal(diff.newViolatesFourPct,false);
assert.ok(diff.swaleCountNew<=diff.swaleCountLegacy);

console.log('MANTRA83_SHADOW_RUNNER_PASS '+JSON.stringify(diff));
