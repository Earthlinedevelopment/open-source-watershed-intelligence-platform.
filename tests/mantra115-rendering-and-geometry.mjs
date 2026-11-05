import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync('index.html','utf8');
const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
 .filter(x=>!(/\bsrc=/.test(x[1]))&&!(/application\/(?:json|ld\+json)/.test(x[1]))&&x[2].trim());
for(let i=0;i<scripts.length;i++){
 try{new Function(scripts[i][2])}catch(error){throw Error('Inline script '+i+' failed syntax: '+error)}
}
assert.ok(scripts.length>=60,'Unexpected truncation of Earthline inline scripts');

const gate=html.match(/function earthlineRegionalShapeGate115\(pts\)\{[\s\S]*?\n  \}/);
assert.ok(gate,'M115 geometry gate missing');
const sandbox={window:{}};
vm.runInNewContext(gate[0]+'\nwindow.gate=earthlineRegionalShapeGate115;',sandbox,{timeout:2500});
const g=sandbox.window.gate;
for(const [name,coordinates,expected] of [
 ['linear',[[0,0],[2,0],[4,0]],true],
 ['natural bend',[[0,0],[2,.2],[4,.5],[6,.7]],true],
 ['hairpin',[[0,0],[4,0],[4,.2],[0,.2]],false],
 ['self crossing',[[0,0],[4,4],[0,4],[4,0]],false],
 ['closed loop',[[0,0],[2,0],[2,2],[0,2],[0,0]],false],
 ['invalid',[[0,0],[NaN,0]],false]
])assert.equal(g(coordinates),expected,name);

const scope=(a,b)=>{
 const x=html.indexOf(a),y=html.indexOf(b,x);
 assert.ok(x>=0&&y>x,'Missing function scope '+a);
 return html.slice(x,y);
};
const regional=scope('function regionalOpportunitySwales15773(', 'function rechargeDataForTile(');
assert.match(regional,/earthlineRegionalShapeGate115\(safe\)/,'fallback proposed swales gate');
assert.match(regional,/earthlineRegionalShapeGate115\(safeDisplay\)/,'primary proposed swales gate');
assert.match(regional,/if\(!Number\.isFinite\(sp\)\|\|sp<0\|\|sp>4\)continue;/,'0-4% terrain acceptance');
assert.doesNotMatch(regional,/earthlineNaturalContourDisplay\((?:seg|bestSeg)\)/,'No second contour-changing smoothing');

const live=scope('function makeSwales(hy,contours,focusMode=false)', 'function jsonp(');
assert.match(live,/checked115=new Set\(\)/,'All corridor grid cells must be verified');
assert.match(live,/slope<0\|\|slope>4/,'Enforce <=4% over full line');
assert.doesNotMatch(live,/const segment=chaikin\(raw,2,false\)/,'No second smoothing on swales');

const visual=scope('function persistVisualPolicy()', 'window.earthlinePersistAquifer16149=');
assert.match(visual,/regionalContextHidden115/,'Regional aquifer must respect Focus and Property');
assert.doesNotMatch(visual,/src\.setData\(aquiferCache\)/,'Do not resurrect stale aquifer geometries');
assert.doesNotMatch(visual,/paint113\('el-live-aquifer-fill-15970','fill-opacity',\.40\)/,'Focus handoff must own regional opacity');

const tier=scope('function applyTierStyling()', 'function syncFullscreen()');
assert.match(tier,/if\(ids\[ids\.length-2\]!==LOCATION_HIT\|\|ids\[ids\.length-1\]!==LOCATION_LABEL\)/,'Do not move unchanged label layers');
console.log('M115_RENDERING_AND_GEOMETRY_PASS',JSON.stringify({inlineScripts:scripts.length,shapeTests:6,geometry: 'screened',aquifer:'single opacity owner'}));
