import fs from 'node:fs';
import assert from 'node:assert/strict';

const files=['shadow/mantra83-shadow-live.js','shadow/mantra83-shadow-runner.mjs'];
for(const file of files){
  const s=fs.readFileSync(file,'utf8');
  for(const forbidden of [
    'earthlinePublishDisplayedRun16151(',
    'earthlineDeliverPropertyResult15817(',
    'earthlineSyncLivingSwales15792(',
    'earthlineApplyRendererOwnership15805(',
    '.setData(',
    '.addSource(',
    '.addLayer(',
    '.setLayoutProperty(',
    '.setPaintProperty(',
    '.fitBounds(',
    '.flyTo(',
    '.easeTo(',
    '.jumpTo('
  ]){
    assert.equal(s.includes(forbidden),false,file+' contains forbidden owner call '+forbidden);
  }
}
console.log('MANTRA83_SHADOW_NONAUTHORITY_PASS');
