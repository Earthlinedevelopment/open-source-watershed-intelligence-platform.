import assert from 'node:assert/strict';
import {
  EARTHLINE_V2_ELDER,
  elderSnapshot,
  propertyElderFreshForRun,
  propertyTreeCoverRule,
  propertyElderExpectationSatisfied
} from '../v2/elder-runtime-contract.js';

assert.equal(EARTHLINE_V2_ELDER.scienceBaseline,'17118');
assert.equal(EARTHLINE_V2_ELDER.rechargeWeight,0);
assert.equal(EARTHLINE_V2_ELDER.dynamicPropertyDatasetId,'dynamic-property-17130');
assert.match(EARTHLINE_V2_ELDER.operationalRule,/tree-covered Property/i);

const run={
  result:true,scientificResult:true,
  startedAt:'2026-10-13T09:32:25.246Z'
};
const fresh={
  summary:{coverageDatasetIds:['dynamic-property-17130']},
  featureCount:24,dynamicCandidatePoolCount:167,
  at:'2026-10-13T09:32:37.244Z'
};
assert.equal(propertyElderFreshForRun(run,fresh),true);

assert.equal(propertyElderFreshForRun(run,{...fresh,summary:{coverageDatasetIds:['california-regional-overview-17130']}}),false);
assert.equal(propertyElderFreshForRun(run,{...fresh,featureCount:0}),false);
assert.equal(propertyElderFreshForRun(run,{...fresh,dynamicCandidatePoolCount:0}),false);
assert.equal(propertyElderFreshForRun(run,{...fresh,at:'2026-10-13T09:31:00.000Z'}),false);

const win={
  EARTHLINE_ELDER_TREES_V2_17118:{state:'approved-v2-17118'},
  EARTHLINE_ELDER_TREE_LAST_17097:fresh
};
const snap=elderSnapshot(win);
assert.equal(snap.available,true);
assert.equal(snap.featureCount,24);
assert.equal(snap.candidatePoolCount,167);
assert.deepEqual([...snap.coverageDatasetIds],['dynamic-property-17130']);

console.log('Earthline V2 Elder runtime contract: PASS');

const treePositive={...fresh,treeCoverRule:{validCoverage:true,treeCovered:true,forestAreaHa:7.2,forestCells:4,candidatePool:167,satisfied:true}};
assert.equal(propertyTreeCoverRule(treePositive).treeCovered,true);
assert.equal(propertyElderExpectationSatisfied(treePositive),true);
const treeZero={...fresh,featureCount:0,dynamicCandidatePoolCount:0,treeCoverRule:{validCoverage:true,treeCovered:true,forestAreaHa:3.1,forestCells:2,candidatePool:0,satisfied:false}};
assert.equal(propertyElderExpectationSatisfied(treeZero),false);
const noTrees={...fresh,featureCount:0,dynamicCandidatePoolCount:0,treeCoverRule:{validCoverage:true,treeCovered:false,forestAreaHa:0,forestCells:0,candidatePool:0,satisfied:true}};
assert.equal(propertyElderExpectationSatisfied(noTrees),true);
