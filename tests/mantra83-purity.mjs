import fs from 'node:fs';
import assert from 'node:assert/strict';

for(const file of ['science/mantra83-core.mjs','science/mantra83-hydrology.mjs']){
  const s=fs.readFileSync(file,'utf8');
  for(const forbidden of ['window.','document.','mapbox','setTimeout(','setInterval(','requestAnimationFrame(','localStorage','sessionStorage']){
    assert.equal(s.includes(forbidden),false,file+' contains runtime dependency '+forbidden);
  }
}
console.log('MANTRA83_PURITY_PASS');
