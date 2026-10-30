import assert from 'node:assert/strict';
import {buildScienceBundle} from '../science/mantra83-engine.mjs';
import {toRendererModel} from '../science/mantra83-renderer-adapter.mjs';

const w=10,h=10,z=new Float64Array(w*h);
for(let y=0;y<h;y++)for(let x=0;x<w;x++)z[y*w+x]=100-y*.01+x*.001;

const bundle=buildScienceBundle({
  runId:'render-1',mode:'property',
  target:{lat:44,lng:-72},extent:[-72.1,43.9,-71.9,44.1],
  dem:{source:'test',resolutionM:5,width:w,height:h,elevation:z},
  cellXM:5,cellYM:5,aquiferFallback:.5,soilFallback:.5,
  swaleCandidates:[{id:'s1',metersPerGrid:1,anchor:{x:2,y:2},samples:[{x:2,y:2,i:22,slopePct:3,flowScore:.8,rechargeScore:.8}]}],
  exclusions:{status:'verified'},waterPaths:[{id:'w1',coordinates:[[0,0],[1,1]]}],
  contours:[{id:'c1',elevationM:100,coordinates:[[0,1],[1,2]]}],
  aquiferEvidence:{status:'screened'},elderEvidence:{status:'screened',rechargeWeight:0},coverage:{status:'complete'}
});
const before=JSON.stringify({runId:bundle.runId,swales:bundle.swales.map(s=>s.id)});
const model=toRendererModel(bundle);
assert.equal(model.runId,'render-1');
assert.equal(model.swales.length,1);
assert.equal(model.waterPaths.length,1);
assert.equal(model.contours.length,1);
assert.ok(Object.isFrozen(model));
assert.ok(Object.isFrozen(model.swales));
assert.equal(JSON.stringify({runId:bundle.runId,swales:bundle.swales.map(s=>s.id)}),before);

let threw=false;
try{ model.runId='changed'; }catch{ threw=true; }
assert.equal(model.runId,'render-1');

console.log('MANTRA83_RENDER_ADAPTER_PASS '+JSON.stringify({swales:model.swales.length,water:model.waterPaths.length,contours:model.contours.length}));
