import test from 'node:test';
import assert from 'node:assert/strict';
import {auditMetricCorridor,certifyRasterCandidate} from '../core/raster-audit.mjs';
import {validatePublication} from '../core/publication-gate.mjs';

const W=30,H=30;
function grid(slope=2){
  const demMeters=new Float64Array(W*H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)demMeters[y*W+x]=100-y*slope/100;
  return {width:W,height:H,cellSizeM:1,originX:0,originY:0,
    metricCrs:'LOCAL_TEST_METRES',gridId:'synthetic-dem-v1',
    maskFingerprint:'synthetic-mask-v1',demMeters,
    validity:new Uint8Array(W*H).fill(1),noBuild:new Uint8Array(W*H)};
}
function flow(){
  return [{id:'f-1',from:[14.5,8.5],to:[14.5,22.5],
    modeledRunoffM3:5,modelSourceId:'synthetic-flow-model'}];
}
const centerlineM=[[8.5,15.5],[21.5,15.5]];
function args(g=grid(),flowSegments=flow()){
  return {grid:g,centerlineM,halfWidthM:0.6,flowSegments,
    flowModelId:'synthetic-flow-model',maskFingerprint:'synthetic-mask-v1'};
}
test('entire footprint audited from DEM, not user-supplied swale average',()=>{
  const a=auditMetricCorridor(args());
  assert.equal(a.status,'verified');
  assert.ok(a.slopeAudit.checkedCells>10);
  assert.ok(Math.abs(a.slopeAudit.maxLocalPct-2)<1e-9);
  assert.equal(a.exclusionAudit.checkedCells,a.slopeAudit.checkedCells);
  assert.equal(a.flowAudit.crossingCount,1);
  assert.equal(a.flowAudit.positiveRunoffEvidence,5);
});
test('flat zero gradient is accepted, excluding steeper than four percent',()=>{
  assert.equal(auditMetricCorridor(args(grid(0))).status,'verified');
  assert.equal(auditMetricCorridor(args(grid(4))).status,'verified');
  const steep=auditMetricCorridor(args(grid(4.01)));
  assert.equal(steep.status,'blocked');
  assert.equal(steep.errors[0],'CORRIDOR_EXCEEDS_4_PCT');
});
test('no-build cell at corridor footprint edge rejects the entire corridor',()=>{
  const g=grid();g.noBuild[14*W+14]=1; // 0.5 m from line, within 0.6 m half-width
  const a=auditMetricCorridor(args(g));
  assert.equal(a.status,'blocked');
  assert.equal(a.errors[0],'CORRIDOR_INTERSECTS_NO_BUILD');
});
test('missing terrain or null DEM neighbor fails closed',()=>{
  const a=grid();a.validity[15*W+14]=0;
  assert.equal(auditMetricCorridor(args(a)).errors[0],'CORRIDOR_HAS_UNKNOWN_TERRAIN');
  const b=grid();b.demMeters[13*W+14]=NaN; // Horn window neighbor to footprint
  assert.equal(auditMetricCorridor(args(b)).errors[0],'CORRIDOR_SLOPE_UNRESOLVED');
});
test('mask identity mismatch blocks even safe-appearing raster',()=>{
  assert.equal(auditMetricCorridor({...args(),maskFingerprint:'older-mask'}).errors[0],
    'EXCLUSION_MASK_FINGERPRINT_MISMATCH');
});
test('a corridor cannot be clipped against an incomplete raster',()=>{
  const a=auditMetricCorridor({...args(),centerlineM:[[0.3,15.5],[9.5,15.5]]});
  assert.equal(a.status,'blocked');
  assert.equal(a.errors[0],'CORRIDOR_OUTSIDE_VERIFIED_RASTER');
});
test('missing, non-crossing, zero or duplicate runoff does not establish interception',()=>{
  const good=flow();
  assert.equal(auditMetricCorridor(args(grid(),[])).errors[0],
    'POSITIVE_RUNOFF_CROSSING_NOT_PROVEN');
  const nonCrossing=[{...good[0],from:[2,8],to:[2,22]}];
  assert.equal(auditMetricCorridor(args(grid(),nonCrossing)).errors[0],
    'POSITIVE_RUNOFF_CROSSING_NOT_PROVEN');
  const zero=[{...good[0],modeledRunoffM3:0}];
  assert.equal(auditMetricCorridor(args(grid(),zero)).errors[0],
    'POSITIVE_RUNOFF_CROSSING_NOT_PROVEN');
  const duplicate=[good[0],{...good[0]}];
  assert.equal(auditMetricCorridor(args(grid(),duplicate)).flowAudit.crossingCount,1);
});
test('invalid or unspecified metric grid cannot silently validate',()=>{
  const g=grid();delete g.metricCrs;
  assert.equal(auditMetricCorridor(args(g)).errors[0],'INVALID_OR_INCOMPLETE_METRIC_GRID');
});
const projectSynthetic=([lon,lat],crs)=>{
  assert.equal(crs,'LOCAL_TEST_METRES');
  return [8.5+(lon+72)*13000,15.5+(lat-44)*1000];
};
test('supplied green checks cannot override actual raster audit',()=>{
  const candidate={runId:'run-1',tier:'property',verifiedZeroOpportunity:false,
    sources:{
      terrain:{status:'verified',dataset:'synthetic',version:'1',coverageId:'raster'},
      hydrography:{status:'verified',dataset:'synthetic',version:'1',coverageId:'raster'},
      landCover:{status:'verified',dataset:'synthetic',version:'1',coverageId:'raster'},
      exclusions:{status:'verified',dataset:'synthetic',version:'1',coverageId:'raster',
        fingerprint:'synthetic-mask-v1',
        classes:{roads:'verified',buildings:'verified',driveways:'verified',mappedWater:'verified'}}},
    groundwater:{status:'unavailable',evidence:[]},
    swales:[{id:'one',coordinates:[[-72,44],[-71.999,44]],
      centerlineM,halfWidthM:0.6,
      slopeAudit:{status:'verified',coverage:'full-corridor',checkedCells:99,maxLocalPct:0},
      flowAudit:{status:'verified',crossingCount:99,positiveRunoffEvidence:99,modelSourceId:'fake'},
      exclusionAudit:{status:'verified',coverage:'full-corridor-footprint',checkedCells:99,
        unsafeIntersections:0,maskFingerprint:'synthetic-mask-v1',corridorId:'one'}}]};
  const g=grid();g.noBuild[14*W+14]=1;
  const verdict=certifyRasterCandidate(candidate,{grid:g,flowSegments:flow(),flowModelId:'synthetic-flow-model',projectLonLat:projectSynthetic});
  assert.equal(verdict.status,'blocked');
  assert.equal(verdict.errors[0],'one:CORRIDOR_INTERSECTS_NO_BUILD');
  g.noBuild[14*W+14]=0;
  const good=certifyRasterCandidate(candidate,{grid:g,flowSegments:flow(),flowModelId:'synthetic-flow-model',projectLonLat:projectSynthetic});
  assert.equal(good.status,'audited');
  assert.equal(good.candidate.swales[0].flowAudit.crossingCount,1);
  assert.equal(validatePublication(good.candidate).status,'verified');
});

test('unregistered CRS projection blocks publication even if raster audits are safe',()=>{
  const c={sources:{exclusions:{fingerprint:'synthetic-mask-v1'}},swales:[]};
  assert.equal(certifyRasterCandidate(c,{grid:grid(),flowSegments:flow(),flowModelId:'synthetic-flow-model'}).errors[0],
    'GEOREFERENCING_TRANSFORM_MISSING');
});
test('a safe audited corridor cannot publish a different mapped swale',()=>{
  const c={sources:{exclusions:{fingerprint:'synthetic-mask-v1'}},
    swales:[{id:'wrong',coordinates:[[-71,44],[-71.999,44]],
      centerlineM,halfWidthM:0.6}]};
  const r=certifyRasterCandidate(c,{grid:grid(),flowSegments:flow(),
    flowModelId:'synthetic-flow-model',projectLonLat:projectSynthetic});
  assert.equal(r.status,'blocked');
  assert.equal(r.errors[0],'wrong:GEOGRAPHIC_METRIC_PATH_MISMATCH');
});
