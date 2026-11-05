import test from 'node:test';
import assert from 'node:assert/strict';
import {verifyFrozenExclusions,REQUIRED_EXCLUSION_CLASSES} from '../core/exclusion-source.mjs';

function fixture(){
  const n=9*9,grid={width:9,height:9,gridId:'tile-2026',
    maskFingerprint:'frozen-class-mask-a',validity:new Uint8Array(n).fill(1),
    noBuild:new Uint8Array(n),exclusionLayers:{}};
  const source={status:'verified',coverageId:grid.gridId,
    fingerprint:grid.maskFingerprint,classes:{}};
  for(const cls of REQUIRED_EXCLUSION_CLASSES){
    grid.exclusionLayers[cls]={presence:new Uint8Array(n),
      known:new Uint8Array(n).fill(1)};
    source.classes[cls]='verified';
  }
  return {grid,source};
}
test('all five complete source classes prove the frozen safe raster',()=>{
  const {grid,source}=fixture();
  const v=verifyFrozenExclusions(grid,source);
  assert.equal(v.status,'verified');
  assert.equal(v.checkedCells,81);
  assert.equal(v.blockedCells,0);
});
test('any road, water or protected land cell must occur in frozen no-build mask',()=>{
  for(const cls of REQUIRED_EXCLUSION_CLASSES){
    const {grid,source}=fixture();
    grid.exclusionLayers[cls].presence[40]=1;
    assert.equal(verifyFrozenExclusions(grid,source).errors[0],
      'EXCLUSION_FROZEN_MASK_NOT_CLASS_UNION');
    grid.noBuild[40]=1;
    const passed=verifyFrozenExclusions(grid,source);
    assert.equal(passed.status,'verified');
    assert.equal(passed.blockedCells,1);
  }
});
test('a frozen no-build cell without source-class support must fail',()=>{
  const {grid,source}=fixture();
  grid.noBuild[18]=1;
  assert.equal(verifyFrozenExclusions(grid,source).errors[0],
    'EXCLUSION_FROZEN_MASK_NOT_CLASS_UNION');
});
test('missing source class, partial coverage and unknown cells all block',()=>{
  const a=fixture();delete a.grid.exclusionLayers.driveways;
  assert.equal(verifyFrozenExclusions(a.grid,a.source).errors[0],
    'EXCLUSION_CLASS_SOURCE_OR_COVERAGE_MISSING');
  const b=fixture();b.grid.exclusionLayers.mappedWater.known[0]=0;
  assert.equal(verifyFrozenExclusions(b.grid,b.source).errors[0],
    'EXCLUSION_CLASS_COVERAGE_GAP');
  const c=fixture();c.grid.exclusionLayers.roads.presence[0]=2;
  assert.equal(verifyFrozenExclusions(c.grid,c.source).errors[0],
    'EXCLUSION_CLASS_NONBINARY');
});
test('invalid source identity cannot attest to otherwise complete class arrays',()=>{
  const a=fixture();a.source.fingerprint='previous-run';
  assert.equal(verifyFrozenExclusions(a.grid,a.source).errors[0],
    'EXCLUSION_SOURCE_GRID_FINGERPRINT_MISMATCH');
  const b=fixture();b.source.classes.protectedLand='unknown';
  assert.equal(verifyFrozenExclusions(b.grid,b.source).errors[0],
    'EXCLUSION_CLASS_SOURCE_OR_COVERAGE_MISSING');
});
