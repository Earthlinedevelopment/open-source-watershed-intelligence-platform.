import assert from 'node:assert/strict';
import {RunCoordinator} from '../science/mantra83-coordinator.mjs';

function input(runId,mode,lat,lng){
  const w=12,h=12,z=new Float64Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)z[y*w+x]=100-y*.01+x*.002;
  return {
    runId,mode,target:{lat,lng},extent:[lng-.1,lat-.1,lng+.1,lat+.1],
    dem:{source:'test',resolutionM:5,width:w,height:h,elevation:z},
    cellXM:5,cellYM:5,aquiferFallback:.5,soilFallback:.5,
    swaleCandidates:[{id:runId+'-s1',metersPerGrid:1,anchor:{x:4,y:4},samples:[{x:4,y:4,i:52,slopePct:3,flowScore:.8,rechargeScore:.8}]}],
    exclusions:{status:'verified'},waterPaths:[],contours:[],
    aquiferEvidence:{status:'screened'},elderEvidence:{status:'screened',rechargeWeight:0},coverage:{status:'complete'}
  };
}

const c=new RunCoordinator();

const p1=await c.run(input('p1','property',44,-72));
assert.equal(p1.status,'published');
assert.equal(c.publishedRunId,'p1');
assert.equal(p1.renderer.runId,'p1');

const r1=await c.run(input('r1','regional',35,-97));
assert.equal(r1.status,'published');
assert.equal(c.publishedRunId,'r1');
assert.equal(r1.renderer.mode,'regional');
assert.equal(r1.renderer.runId,'r1');

const p2=await c.run(input('p2','property',32,-110));
assert.equal(p2.status,'published');
assert.equal(c.publishedRunId,'p2');
assert.equal(p2.renderer.mode,'property');
assert.equal(p2.renderer.runId,'p2');

assert.notEqual(p1.renderer.target.lat,r1.renderer.target.lat);
assert.notEqual(r1.renderer.target.lat,p2.renderer.target.lat);
assert.equal(p1.renderer.swales[0].id,'p1-s1');
assert.equal(r1.renderer.swales[0].id,'r1-s1');
assert.equal(p2.renderer.swales[0].id,'p2-s1');

console.log('MANTRA83_COORDINATOR_PASS '+JSON.stringify({sequence:['p1','r1','p2'],published:c.publishedRunId}));
