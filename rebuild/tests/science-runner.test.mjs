import test from 'node:test';
import assert from 'node:assert/strict';
import {createAnalysisOwner} from '../core/run-owner.mjs';
import {publishRasterAnalysis} from '../core/science-runner.mjs';

const W=30,H=30,N=W*H;
function grid(){
  const demMeters=new Float64Array(N);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)demMeters[y*W+x]=100-y*0.02;
  const exclusionLayers=Object.fromEntries(
    ['roads','buildings','driveways','mappedWater','protectedLand'].map(cls=>
      [cls,{presence:new Uint8Array(N),known:new Uint8Array(N).fill(1)}]));
  return {width:W,height:H,cellSizeM:1,originX:0,originY:0,
    metricCrs:'LOCAL_TEST_METRES',gridId:'test-tile-1',maskFingerprint:'test-mask-1',
    demMeters,validity:new Uint8Array(N).fill(1),noBuild:new Uint8Array(N),
    exclusionLayers};
}
const source=(dataset,coverageId)=>({status:'verified',dataset,version:'synthetic-v1',coverageId});
function setup(){
  const owner=createAnalysisOwner(),token=owner.begin('property',{lon:-72,lat:44}),g=grid();
  const candidate={
    runId:token.id,tier:'property',verifiedZeroOpportunity:false,
    sources:{
      terrain:source('synthetic-terrain',g.gridId),
      hydrography:source('synthetic-hydrography',g.gridId),
      landCover:source('synthetic-land',g.gridId),
      exclusions:{...source('synthetic-mask',g.gridId),fingerprint:g.maskFingerprint,
        classes:{roads:'verified',buildings:'verified',driveways:'verified',mappedWater:'verified',protectedLand:'verified'}}},
    groundwater:{status:'unavailable',evidence:[]},
    swales:[{id:'corridor-1',coordinates:[[-72,44],[-71.999,44]],
      centerlineM:[[8.5,15.5],[21.5,15.5]],halfWidthM:0.6}]
  };
  const runoff={...source('synthetic-rainfall-runoff',g.gridId),
    depthM:0.01,modelSourceId:'synthetic-d8-runoff',period:'synthetic-event'};
  const projectLonLat=([lon,lat],crs)=>{
    assert.equal(crs,'LOCAL_TEST_METRES');
    return [8.5+(lon+72)*13000,15.5+(lat-44)*1000];
  };
  return {owner,token,inputs:{grid:g,candidate,runoff,projectLonLat}};
}
test('end-to-end DEM D8 + actual raster footprint audit + immutable publication',()=>{
  const {owner,token,inputs}=setup();
  const result=publishRasterAnalysis(owner,token,inputs);
  assert.equal(result.accepted,true);
  const s=owner.snapshot();
  assert.equal(s.status,'verified');
  assert.equal(s.publication.swales.length,1);
  assert.equal(s.publication.swales[0].slopeAudit.coverage,'full-corridor');
  assert.equal(s.publication.swales[0].exclusionAudit.unsafeIntersections,0);
  assert.ok(s.publication.swales[0].flowAudit.positiveRunoffEvidence>0);
  assert.equal(s.publication.swales[0].rasterEvidence.gridId,'test-tile-1');
});
test('no-build intersection invalidates entire analysis instead of hiding one swale',()=>{
  const {owner,token,inputs}=setup();
  inputs.grid.noBuild[14*W+14]=1;
  inputs.grid.exclusionLayers.buildings.presence[14*W+14]=1;
  const r=publishRasterAnalysis(owner,token,inputs);
  assert.equal(r.status,'blocked');
  assert.equal(owner.snapshot().publication,null);
  assert.match(owner.snapshot().errors.join(','),/CORRIDOR_INTERSECTS_NO_BUILD/);
});
test('coverage provenance or runoff gap blocks safely',()=>{
  const a=setup();a.inputs.runoff.period='';
  assert.equal(publishRasterAnalysis(a.owner,a.token,a.inputs).status,'blocked');
  assert.equal(a.owner.snapshot().publication,null);
  const b=setup();b.inputs.candidate.sources.terrain.coverageId='different-tile';
  assert.equal(publishRasterAnalysis(b.owner,b.token,b.inputs).status,'blocked');
  assert.deepEqual(b.owner.snapshot().errors,['TERRAIN_COVERAGE_NOT_BOUND_TO_RUN']);
});
test('unsupported projection cannot be substituted with an arbitrary display path',()=>{
  const {owner,token,inputs}=setup();
  inputs.candidate.swales[0].coordinates[0]=[-73,44];
  const r=publishRasterAnalysis(owner,token,inputs);
  assert.equal(r.status,'blocked');
  assert.match(r.errors.join(','),/GEOGRAPHIC_METRIC_PATH_MISMATCH/);
});
test('stale run is rejected without changing the current analysis',()=>{
  const {owner,token,inputs}=setup();
  const newer=owner.begin('regional',{lon:-72,lat:44});
  assert.deepEqual(publishRasterAnalysis(owner,token,inputs),{accepted:false,status:'stale'});
  assert.equal(owner.snapshot().id,newer.id);
  assert.equal(owner.snapshot().status,'running');
});
test('explicit scientific failure blocks further same-run publication',()=>{
  const {owner,token,inputs}=setup();
  inputs.runoff.depthM=0;
  assert.equal(publishRasterAnalysis(owner,token,inputs).status,'blocked');
  inputs.runoff.depthM=0.01;
  assert.deepEqual(publishRasterAnalysis(owner,token,inputs),
    {accepted:false,status:'settled'});
});

test('an unsupported frozen no-build mask or missing protected-land coverage blocks before hydrology',()=>{
  const a=setup();
  a.inputs.grid.noBuild[14*W+14]=1;
  const result=publishRasterAnalysis(a.owner,a.token,a.inputs);
  assert.equal(result.status,'blocked');
  assert.deepEqual(a.owner.snapshot().errors,['EXCLUSION_FROZEN_MASK_NOT_CLASS_UNION']);
  assert.equal(a.owner.snapshot().publication,null);

  const b=setup();
  b.inputs.grid.exclusionLayers.protectedLand.known[14*W+14]=0;
  const result2=publishRasterAnalysis(b.owner,b.token,b.inputs);
  assert.equal(result2.status,'blocked');
  assert.deepEqual(b.owner.snapshot().errors,['EXCLUSION_CLASS_COVERAGE_GAP']);
  assert.equal(b.owner.snapshot().publication,null);
});
