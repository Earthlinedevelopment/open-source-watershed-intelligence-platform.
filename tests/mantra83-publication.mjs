import assert from 'node:assert/strict';
import {buildScienceBundle} from '../science/mantra83-engine.mjs';
import {publishableSnapshot,validateForPublication} from '../science/mantra83-publication.mjs';

const w=12,h=12,z=new Float64Array(w*h);
for(let y=0;y<h;y++)for(let x=0;x<w;x++)z[y*w+x]=50-y*.01+x*.002;
const input={
  runId:'pub-1',mode:'property',target:{lat:44,lng:-72},extent:[-72.1,43.9,-71.9,44.1],
  dem:{source:'test',resolutionM:5,width:w,height:h,elevation:z},
  cellXM:5,cellYM:5,aquiferFallback:.5,soilFallback:.5,annualPrecipIn:30,
  swaleCandidates:[{id:'s1',metersPerGrid:1,anchor:{x:4,y:4},samples:[{x:4,y:4,i:52,slopePct:3,flowScore:.8,rechargeScore:.8}]}],
  exclusions:{status:'verified'},waterPaths:[],contours:[],
  aquiferEvidence:{status:'screened'},elderEvidence:{status:'screened',rechargeWeight:0},coverage:{status:'complete'}
};
const bundle=buildScienceBundle(input);
assert.equal(validateForPublication(bundle),true);
const snap=publishableSnapshot(bundle);
assert.equal(snap.runId,'pub-1');
assert.equal(snap.swales.length,1);
assert.ok(Object.isFrozen(snap));
assert.equal(JSON.stringify(snap),JSON.stringify(publishableSnapshot(bundle)));
console.log('MANTRA83_PUBLICATION_PASS '+JSON.stringify({runId:snap.runId,swales:snap.swales.length}));
