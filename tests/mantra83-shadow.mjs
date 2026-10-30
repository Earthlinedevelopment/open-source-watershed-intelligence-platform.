import assert from 'node:assert/strict';
import {compareRuns} from '../science/mantra83-shadow.mjs';

const legacy={runId:'r1',target:{lat:44,lng:-72},swales:[{maxSlopePct:33},{maxSlopePct:3}]};
const modern={runId:'r1',science:{runId:'r1',target:{lat:44,lng:-72},swales:[{maxSlopePct:4}]}};
const x=compareRuns({legacy,newRun:modern});

assert.equal(x.targetDeltaM,0);
assert.equal(x.swaleCountLegacy,2);
assert.equal(x.swaleCountNew,1);
assert.equal(x.legacyViolatesFourPct,true);
assert.equal(x.newViolatesFourPct,false);
assert.equal(x.samePublicationIdentity,true);

console.log('MANTRA83_SHADOW_PASS '+JSON.stringify(x));
