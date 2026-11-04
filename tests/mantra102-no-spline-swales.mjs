import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('index.html', 'utf8');
const lines = html.split('\n');
const spline = lines.find(line => line.includes('function spline(pts){'));
const polyline = lines.find(line => line.includes('function earthlineSwalePolylineM102(pts){'));
const renderer = lines.find(line => line.includes('function addPath(g,pts,attrs){'));
assert.ok(spline && polyline && renderer, 'Expected native spline, source-aligned swale polyline, and shared SVG renderer');

const ctx = {
  svgEl: (tag, attrs) => ({tag, attrs}),
};
vm.runInNewContext(
  [spline, polyline, renderer, 'globalThis.addPathTest = addPath;'].join('\n'),
  ctx, {timeout: 3000}
);
const pts = [{x: 0, y: 0}, {x: 10, y: 20}, {x: 20, y: 2}, {x: 30, y: 14}];
function group(name) {
  const children = [];
  return {
    getAttribute: k => k === 'data-layer' ? name : null,
    appendChild: child => children.push(child),
    children,
  };
}
const swales = group('swale-opportunities');
const contours = group('numbered-elevation-contours');
ctx.addPathTest(swales, pts, {stroke: 'blue'});
ctx.addPathTest(contours, pts, {stroke: 'white'});
assert.equal(swales.children.length, 1);
assert.equal(contours.children.length, 1);
assert.equal(swales.children[0].attrs.d, 'M 0.0 0.0 L 10.0 20.0 L 20.0 2.0 L 30.0 14.0');
assert.ok(!/(?:^|\s)C\s/.test(swales.children[0].attrs.d), 'No cubic spline control points may alter swale path');
assert.ok(/(?:^|\s)C\s/.test(contours.children[0].attrs.d), 'Approved contour smoothing must be preserved');
assert.equal(swales.children[0].attrs.stroke, 'blue');
assert.equal(contours.children[0].attrs.stroke, 'white');
console.log('MANTRA102_SWALENOWORM_SVG_PASS: exact vetted source vertices, no cubic worm; contours preserved');
