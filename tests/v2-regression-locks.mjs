import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const manifest=JSON.parse(await readFile(new URL('../v2/runtime-manifest.json',import.meta.url),'utf8'));
assert.equal(manifest.locks.rendered_page_is_acceptance_authority,true);
assert.equal(manifest.locks.zero_cost,true);
assert.equal(manifest.owners.elder_trees.science_baseline,'17118');
assert.equal(manifest.owners.elder_trees.recharge_weight,0);
assert.equal(manifest.owners.imagery.blocking,false);

const dir=new URL('../v2/',import.meta.url);
const names=(await readdir(dir)).filter(n=>n.endsWith('.js'));
for(const name of names){
  const s=await readFile(new URL('../v2/'+name,import.meta.url),'utf8');
  assert.doesNotMatch(s,/new\s+MutationObserver\s*\(/,name+' adds MutationObserver owner');
  assert.doesNotMatch(s,/setInterval\s*\(/,name+' adds polling owner');
  assert.doesNotMatch(s,/\.on\s*\(\s*['"]styledata['"]/,name+' adds styledata owner');
  assert.doesNotMatch(s,/\.on\s*\(\s*['"]idle['"]/,name+' adds idle owner');
  assert.doesNotMatch(s,/\.on\s*\(\s*['"]render['"]/,name+' adds map-render owner');
}
const css=await readFile(new URL('../v2/stability-compat.css',import.meta.url),'utf8');
assert.match(css,/#earthlineRegionalVectorOverlay16020\s*\{[^}]*pointer-events\s*:\s*none/is);
assert.match(css,/\.earthline-swale-hit-16070\s*\{[^}]*pointer-events\s*:\s*auto/is);

console.log('Earthline V2 V1-lessons regression locks: PASS');
