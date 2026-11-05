import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync('index.html','utf8');
const start=html.indexOf('function render(data){lastData=data||lastData');
const end=html.indexOf('function schedule()',start);
assert.ok(start>0&&end>start,'Regional SVG renderer must remain present');
const render=html.slice(start,end);

// A refresh cannot first destroy the displayed SVG and then rebuild nodes
// incrementally; draw in a disconnected fragment and commit once.
assert.match(render,/const frame115=document\.createDocumentFragment\(\)/);
assert.match(render,/frame115\.appendChild\(defs\)/);
assert.match(render,/frame115\.append\(cg,sg,lg\)/);
assert.match(render,/el\.replaceChildren\(frame115\)/);
assert.equal((render.match(/el\.replaceChildren\(/g)||[]).length,1,
  'Exactly one SVG publication for each render');
assert.ok(render.indexOf('frame115.append(cg,sg,lg)')<
  render.indexOf('el.replaceChildren(frame115)'),
  'SVG must be complete before replacing the existing frame');
assert.ok(render.indexOf('el.replaceChildren(frame115)')<
  render.indexOf('earthlineDecorateSwales16149'),
  'Swale decorators must run against the committed SVG');

const nativeStart=html.lastIndexOf('function hideNative(){',start);
const nativeEnd=html.indexOf('function activeTier16168()',nativeStart);
assert.ok(nativeStart>0&&nativeEnd>nativeStart);
const visibility=html.slice(nativeStart,nativeEnd);
assert.match(visibility,/getLayoutProperty\(id,'visibility'\)/,
  'Inspect Mapbox state before writing layout properties');
assert.match(visibility,/visibility!=='visible'/,
  'Do not reapply visible when already visible');
assert.match(visibility,/!=='none'/,
  'Do not reapply none when already hidden');

console.log('MANTRA115_ATOMIC_RENDER_STATIC_PASS: atomic SVG swap + idempotent Mapbox layout writes');
