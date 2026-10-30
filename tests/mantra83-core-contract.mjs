import assert from 'node:assert/strict';
import {SWALE,RECHARGE_WEIGHTS,rechargeSuitability,swaleCellEligible} from '../science/mantra83-core.mjs';

assert.equal(SWALE.maxSlopePct,4);
assert.equal(SWALE.targetSpacingM,6.096);
assert.equal(SWALE.minSpacingM,4.572);
assert.equal(SWALE.maxSpacingM,7.620);
assert.equal(Object.values(RECHARGE_WEIGHTS).reduce((a,b)=>a+b,0).toFixed(2),'1.00');

assert.equal(swaleCellEligible({slopePct:0}),true);
assert.equal(swaleCellEligible({slopePct:4}),true);
assert.equal(swaleCellEligible({slopePct:4.0001}),false);
assert.equal(swaleCellEligible({slopePct:3,roadOrDriveway:true}),false);
assert.equal(swaleCellEligible({slopePct:3,structureOrImpervious:true}),false);
assert.equal(swaleCellEligible({slopePct:3,water:true}),false);
assert.equal(swaleCellEligible({slopePct:3,majorChannel:true}),false);
assert.equal(swaleCellEligible({slopePct:3,manualNoBuild:true}),false);
assert.equal(swaleCellEligible({slopePct:3,canopyScore:.41,canopyKnown:true}),false);
assert.equal(swaleCellEligible({slopePct:3,canopyScore:.39,canopyKnown:true}),true);

for(const v of [
  rechargeSuitability({aquifer:.45,soil:.55,slopePct:0,flow:.5,annualPrecipIn:30}),
  rechargeSuitability({aquifer:1,soil:1,slopePct:4,flow:1,annualPrecipIn:10})
]) assert.ok(v>=0&&v<=1);

console.log('MANTRA83_CORE_CONTRACT_PASS');
