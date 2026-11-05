import test from 'node:test';
import assert from 'node:assert/strict';
import {deriveTerrainFlow,routedFlowSegments} from '../core/terrain-flow.mjs';
import {auditMetricCorridor} from '../core/raster-audit.mjs';

const W=30,H=30,N=W*H;
function grid(slope=2){
  const demMeters=new Float64Array(N);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)demMeters[y*W+x]=100-y*slope/100;
  return {width:W,height:H,cellSizeM:1,originX:0,originY:0,
    metricCrs:'LOCAL_TEST_METRES',gridId:'test-watershed-1',
    maskFingerprint:'test-mask-v1',demMeters,
    validity:new Uint8Array(N).fill(1),noBuild:new Uint8Array(N)};
}
test('priority-flood D8 has strictly descending output and accumulates cells',()=>{
  const g=grid(),d=deriveTerrainFlow(g);
  assert.equal(d.status,'derived');
  assert.equal(d.validCells,N);
  const i=10*W+12;
  assert.equal(d.to[i],11*W+12);
  assert.ok(d.accCells[i]>1);
  assert.ok(d.filledMeters[i]>d.filledMeters[d.to[i]]);
  assert.ok(g.demMeters[i]===100-10*.02,'original DEM untouched');
});
test('terrain routing is deterministic across repeated runs',()=>{
  const g=grid(),a=deriveTerrainFlow(g),b=deriveTerrainFlow(g);
  assert.deepEqual([...a.to],[...b.to]);
  assert.deepEqual([...a.accCells],[...b.accCells]);
});
test('flat terrain remains valid and routes through modeled fill',()=>{
  const d=deriveTerrainFlow(grid(0));
  assert.equal(d.status,'derived');
  assert.ok(d.validCells>0);
  assert.ok([...d.to].some(v=>v>=0));
  assert.equal(Math.min(...d.accCells),1);
});
test('terrain gaps are isolated and never routed into',()=>{
  const g=grid();g.validity[10*W+10]=0;g.demMeters[10*W+10]=NaN;
  const d=deriveTerrainFlow(g);
  assert.equal(d.status,'derived');
  assert.equal(d.to[10*W+10],-1);
  for(const target of d.to)assert.notEqual(target,10*W+10);
});
test('declared valid cells with missing elevations fail closed',()=>{
  const g=grid();g.demMeters[10*W+10]=NaN;
  assert.equal(deriveTerrainFlow(g).errors[0],'DEM_INCOMPLETE_OR_INVALID');
});
test('routed flow requires explicitly supplied modeled runoff and source',()=>{
  const g=grid(),d=deriveTerrainFlow(g);
  assert.equal(routedFlowSegments(g,d,{}).errors[0],
    'SOURCE_BACKED_RUNOFF_DEPTH_MISSING');
  assert.equal(routedFlowSegments(g,d,{runoffDepthM:0.02}).status,'blocked');
});
test('routed D8 segments have source ID and positive modeled runoff',()=>{
  const g=grid(),d=deriveTerrainFlow(g);
  const result=routedFlowSegments(g,d,{runoffDepthM:0.012,modelSourceId:'synthetic-runoff-1'});
  assert.equal(result.status,'derived');
  assert.ok(result.segments.length>W);
  assert.ok(result.segments.every(s=>s.modeledRunoffM3>0&&
    s.modelSourceId==='synthetic-runoff-1'));
});
test('DEM-derived D8 runoff can be tested against a proposed safe footprint',()=>{
  const g=grid(),d=deriveTerrainFlow(g);
  const f=routedFlowSegments(g,d,{runoffDepthM:0.012,modelSourceId:'synthetic-runoff-1'});
  assert.equal(f.status,'derived');
  const result=auditMetricCorridor({grid:g,centerlineM:[[8.5,15.5],[21.5,15.5]],
    halfWidthM:0.6,flowSegments:f.segments,flowModelId:f.modelSourceId,
    maskFingerprint:g.maskFingerprint});
  assert.equal(result.status,'verified');
  assert.ok(result.flowAudit.crossingCount>0);
  assert.ok(result.flowAudit.positiveRunoffEvidence>0);
});

test('an island surrounded by internal DEM no-data cannot invent an outlet',()=>{
  const g=grid();
  g.validity.fill(0);
  g.demMeters.fill(NaN);
  for(let y=12;y<=16;y++)for(let x=12;x<=16;x++){
    const i=y*W+x;
    g.validity[i]=1;
    g.demMeters[i]=100-y*0.02;
  }
  const d=deriveTerrainFlow(g);
  assert.equal(d.status,'blocked');
  assert.deepEqual(d.errors,['UNREACHABLE_VALID_TERRAIN']);
});
