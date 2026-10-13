import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const arch=JSON.parse(await readFile(new URL('../v2/architecture.json', import.meta.url),'utf8'));
assert.equal(arch.principles.rendered_page_is_authority,true);
assert.equal(arch.principles.one_owner_per_state,true);
assert.equal(arch.principles.atomic_publication,true);
assert.equal(arch.principles.stale_async_rejected_by_run_token,true);
assert.equal(arch.principles.production_origin_equivalent_acceptance,true);
assert.equal(arch.principles.accepted_baseline_immutable,true);
assert.equal(arch.principles.zero_cost,true);
assert.deepEqual(arch.lifecycle.states,['IDLE','REGIONAL_RUNNING','REGIONAL_COMMITTED','PROPERTY_TARGETED','PROPERTY_RUNNING','PROPERTY_COMMITTED','FAILED']);
assert.equal(arch.owners.regional_publication,arch.owners.property_target);
assert.equal(arch.owners.property_target,arch.owners.property_publication);
assert.equal(arch.positive_controls.elder_california_2026_10_13.required,true);
assert.ok(arch.positive_controls.elder_california_2026_10_13.observed_display_count>=1);

const lessons=await readFile(new URL('../v2/V1-LESSONS-ENGINEERING-RULES.md', import.meta.url),'utf8');
for(const required of [
  'Rendered page is the acceptance authority',
  'One owner per state transition',
  'Atomic publication',
  'No late writer may erase a committed result',
  'Run-token ownership',
  'Production-origin equivalence',
  'Known-positive controls are permanent'
]) assert.ok(lessons.includes(required),required);

console.log('Earthline V2 V1-lessons contract: PASS');
