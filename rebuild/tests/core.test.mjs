import test from 'node:test';
import assert from 'node:assert/strict';
import {createAnalysisOwner} from '../core/run-owner.mjs';
import {validatePublication} from '../core/publication-gate.mjs';
import {validatePolyline, svgPolylinePath} from '../core/geometry.mjs';

// SYNTHETIC contract fixture, not a scientifically verified real site.
const input = dataset => ({status:'verified',dataset,version:'synthetic-1',coverageId:'synthetic-cell'});
function fixture(token, {count = 1} = {}) {
  const exclusions = {...input('synthetic-no-build-mask'),fingerprint:'synthetic-mask-v1',
    classes:{roads:'verified',buildings:'verified',driveways:'verified',mappedWater:'verified'}};
  return {runId:token.id,tier:token.tier,
    sources:{terrain:input('synthetic-dem'),hydrography:input('synthetic-flow'),
      landCover:input('synthetic-land'),exclusions},
    groundwater:{status:'unavailable',evidence:[]},
    verifiedZeroOpportunity: count === 0,
    swales:Array.from({length:count},(_,i)=>({id:'s'+(i+1),
      coordinates:[[0.001*i,0],[0.001*i+0.0001,0.0001]],
      slopeAudit:{status:'verified',coverage:'full-corridor',checkedCells:20,maxLocalPct:4},
      flowAudit:{status:'verified',crossingCount:1,positiveRunoffEvidence:1,modelSourceId:'synthetic-flow'},
      exclusionAudit:{status:'verified',coverage:'full-corridor-footprint',corridorId:'s'+(i+1),
        checkedCells:20,unsafeIntersections:0,maskFingerprint:'synthetic-mask-v1'}}))};
}
const target={lon:-72.9,lat:43.6};
function start(tier='property') {const owner=createAnalysisOwner();const token=owner.begin(tier,target);return {owner,token};}

test('0% and 4% inclusive; above 4% blocked',()=>{
  const {token}=start();const c=fixture(token);
  c.swales[0].slopeAudit.maxLocalPct=0;
  assert.equal(validatePublication(c).status,'verified');
  c.swales[0].slopeAudit.maxLocalPct=4;
  assert.equal(validatePublication(c).status,'verified');
  c.swales[0].slopeAudit.maxLocalPct=4.001;
  assert.match(validatePublication(c).errors.join(','),/SLOPE_NOT_VERIFIED/);
});
test('missing inputs and no-build coverage block publication',()=>{
  const {token}=start();const c=fixture(token);
  delete c.sources.terrain;c.sources.exclusions.classes.driveways='missing';
  assert.deepEqual(validatePublication(c).errors.slice(0,2),
    ['TERRAIN_NOT_VERIFIED','EXCLUSION_MASK_SOURCES_NOT_VERIFIED']);
});
test('full-footprint audit must match exact mask and corridor identity',()=>{
  const {token}=start();const c=fixture(token);
  c.swales[0].exclusionAudit.maskFingerprint='different-mask';
  assert.match(validatePublication(c).errors.join(','),/EXCLUSION_AUDIT_FAILED/);
  c.swales[0].exclusionAudit.maskFingerprint='synthetic-mask-v1';
  c.swales[0].exclusionAudit.unsafeIntersections=1;
  assert.match(validatePublication(c).errors.join(','),/EXCLUSION_AUDIT_FAILED/);
});
test('positive runoff crossing evidence is mandatory',()=>{
  const {token}=start();const c=fixture(token);
  c.swales[0].flowAudit.crossingCount=0;
  assert.match(validatePublication(c).errors.join(','),/RUNOFF_INTERCEPTION_NOT_VERIFIED/);
});
test('zero opportunity and failure are distinguishable',()=>{
  const {token}=start();const c=fixture(token,{count:0});
  assert.equal(validatePublication(c).status,'verified-empty');
  c.verifiedZeroOpportunity=false;
  assert.equal(validatePublication(c).status,'blocked');
});
test('groundwater absence is honest, fabricated claim blocked',()=>{
  const {token}=start();const c=fixture(token);
  assert.equal(validatePublication(c).status,'verified');
  c.groundwater={status:'unavailable',evidence:[{name:'invented'}]};
  assert.equal(validatePublication(c).status,'blocked');
});
test('no self-crossing, loops or spline-based swale paths',()=>{
  assert.deepEqual(validatePolyline([[0,0],[1,1],[0,1],[1,0]]),['GEOMETRY_SELF_INTERSECTS']);
  assert.deepEqual(validatePolyline([[0,0],[1,0],[1,1],[0,0]]),['GEOMETRY_CLOSED_LOOP']);
  assert.deepEqual(validatePolyline([[0,0],[1,0]]),[]);
  assert.equal(svgPolylinePath([[0,0],[1,1],[2,1]]),'M 0 0 L 1 1 L 2 1');
});
test('stale completion cannot publish after new analysis begins',()=>{
  const owner=createAnalysisOwner(),first=owner.begin('property',target),old=fixture(first);
  const second=owner.begin('regional',target);
  assert.equal(first.signal.aborted,true);
  assert.deepEqual(owner.publish(first,old),{accepted:false,status:'stale'});
  assert.equal(owner.snapshot().publication,null);
  assert.equal(owner.publish(second,fixture(second)).accepted,true);
  assert.equal(owner.snapshot().tier,'regional');
});
test('five property/regional repeat cycles retain the correct owner',()=>{
  const owner=createAnalysisOwner();
  for(let i=0;i<5;i++)for(const tier of ['property','regional','property']){
    const t=owner.begin(tier,target);
    assert.equal(owner.publish(t,fixture(t)).accepted,true);
    const s=owner.snapshot();
    assert.equal(s.tier,tier);assert.equal(s.publication.runId,t.id);
    assert.equal(s.publication.tier,tier);
  }
});
test('tampering with published results cannot change science',()=>{
  const {owner,token}=start();const c=fixture(token);
  assert.equal(owner.publish(token,c).accepted,true);
  c.swales[0].slopeAudit.maxLocalPct=99;
  const snap=owner.snapshot();
  assert.equal(snap.publication.swales[0].slopeAudit.maxLocalPct,4);
  assert.throws(()=>{snap.publication.swales[0].slopeAudit.maxLocalPct=99},TypeError);
});
test('mismatched run ID and tier fail closed',()=>{
  const {owner,token}=start();const c=fixture(token);c.runId='run-other';
  assert.equal(owner.publish(token,c).status,'blocked');
  assert.equal(owner.snapshot().publication,null);
});
test('cancel clears result and invalidates token',()=>{
  const {owner,token}=start();
  assert.equal(owner.cancel(token),true);
  assert.deepEqual(owner.publish(token,fixture(token)),{accepted:false,status:'stale'});
});

test('completed run cannot be republished or mutated',()=>{
  const {owner,token}=start(); const c=fixture(token);
  assert.equal(owner.publish(token,c).accepted,true);
  c.swales[0].slopeAudit.maxLocalPct=1;
  assert.deepEqual(owner.publish(token,c),{accepted:false,status:'settled'});
  assert.equal(owner.snapshot().publication.swales[0].slopeAudit.maxLocalPct,4);
});
test('blocked run cannot be repaired by a competing same-token completion',()=>{
  const {owner,token}=start(); const c=fixture(token);
  c.swales[0].slopeAudit.maxLocalPct=5;
  assert.equal(owner.publish(token,c).status,'blocked');
  c.swales[0].slopeAudit.maxLocalPct=2;
  assert.deepEqual(owner.publish(token,c),{accepted:false,status:'settled'});
  assert.equal(owner.snapshot().publication,null);
});
