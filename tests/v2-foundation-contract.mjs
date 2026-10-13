import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('../v2/runtime-manifest.json', import.meta.url), 'utf8'));
assert.equal(manifest.version, 'earthline-v2-stable-replacement-17138');
assert.equal(manifest.status, 'WORKING_OFF_PRODUCTION');
assert.equal(manifest.base.v1_locked_commit, '4e80d2a5bfb1ba64661bcf5b9e5c91a0b677c398');
assert.equal(manifest.locks.zero_cost, true);
assert.equal(manifest.locks.one_map, true);
assert.equal(manifest.locks.one_control_rail, true);
assert.equal(manifest.locks.search_orb_locked, true);
assert.equal(manifest.locks.logo_locked, true);
assert.equal(manifest.locks.rendered_page_is_acceptance_authority, true);

const owners = manifest.owners;
assert.equal(owners.elder_trees.science_baseline, '17118');
assert.equal(owners.elder_trees.recharge_weight, 0);
assert.equal(owners.elder_trees.transport, 'earthline-chmv2-range');
assert.equal(owners.imagery.blocking, false);

const bootstrap = await readFile(new URL('../v2/bootstrap.js', import.meta.url), 'utf8');
assert.match(bootstrap, /EARTHLINE_V2_BUILD = '17138'/);
assert.match(bootstrap, /renderedPageIsAcceptanceAuthority: true/);
assert.doesNotMatch(bootstrap, /pages-live/);

const launch = await readFile(new URL('../earthline-launch-16872.js', import.meta.url), 'utf8');
assert.match(launch, /EARTHLINE_ELDER_TREES_V2_17118/);
assert.match(launch, /scienceBaseline:'17118'/);
assert.match(launch, /rechargeWeight:0/);

const worker = await readFile(new URL('../earthline-elder-worker-17129.js', import.meta.url), 'utf8');
assert.match(worker, /earthline-chmv2-range/);
assert.match(worker, /science_baseline:"17118"/);
assert.match(worker, /candidate_pool_count/);
assert.match(worker, /map_owner:"display_subset"/);

console.log('Earthline V2 17138 foundation contract: PASS');
