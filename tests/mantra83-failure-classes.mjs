import assert from 'node:assert/strict';
import {RunCoordinator} from '../science/mantra83-coordinator.mjs';
import {compareRuns} from '../science/mantra83-shadow.mjs';

function makeInput(runId,mode,lat,lng,slope=3){
  const w=16,h=16,z=new Float64Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)z[y*w+x]=100-y*.02+x*.002;
  return {
    runId,mode,target:{lat,lng},extent:[lng-.1,lat-.1,lng+.1,lat+.1],
    dem:{source:'test',resolutionM:5,width:w,height:h,elevation:z},
    cellXM:5,cellYM:5,aquiferFallback:.5,soilFallback:.5,
    swaleCandidates:[{id:runId+'-s',metersPerGrid:1,anchor:{x:5,y:5},samples:[{x:5,y:5,i:85,slopePct:slope,flowScore:.8,rechargeScore:.8}]}],
    exclusions:{status:'verified'},waterPaths:[],contours:[],
    aquiferEvidence:{status:'screened'},elderEvidence:{status:'screened',rechargeWeight:0},coverage:{status:'complete'}
  };
}

const c=new RunCoordinator();

// Wrong-location identity detection.
const modern=await c.run(makeInput('az-1','property',32.2,-110.9,3));
const wrongLegacy={runId:'az-1',target:{lat:19.9997,lng:-102.0035},swales:[{maxSlopePct:3}]};
const diff=compareRuns({legacy:wrongLegacy,newRun:modern});
assert.ok(diff.targetDeltaM>1000000,'wrong-location shift should be obvious');

// Slope-rule enforcement.
const steep=await c.run(makeInput('steep-1','property',44,-72,5));
assert.equal(steep.science.swales.length,0);

// Property -> Regional -> Property identity isolation.
const p1=await c.run(makeInput('p1','property',44,-72,3));
const r1=await c.run(makeInput('r1','regional',41,-93,3));
const p2=await c.run(makeInput('p2','property',35,-111,3));
assert.equal(c.publishedRunId,'p2');
assert.equal(p1.renderer.runId,'p1');
assert.equal(r1.renderer.runId,'r1');
assert.equal(p2.renderer.runId,'p2');
assert.notDeepEqual(p1.renderer.target,r1.renderer.target);
assert.notDeepEqual(r1.renderer.target,p2.renderer.target);

// Legacy >4% divergence detection.
const legacySteep={runId:'p2',target:{lat:35,lng:-111},swales:[{maxSlopePct:33}]};
const slopeDiff=compareRuns({legacy:legacySteep,newRun:p2});
assert.equal(slopeDiff.legacyViolatesFourPct,true);
assert.equal(slopeDiff.newViolatesFourPct,false);

console.log('MANTRA83_FAILURE_CLASS_PASS '+JSON.stringify({
  wrongTargetDeltaM:diff.targetDeltaM,
  steepNewSwales:steep.science.swales.length,
  finalPublished:c.publishedRunId,
  slopeLegacyViolation:slopeDiff.legacyViolatesFourPct
}));
