import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const origin='https://earthlinedevelopment.org/';
const expected=readFileSync('index.html','utf8');
const response=await fetch(origin+'?m119_parity='+Date.now(),{headers:{'Cache-Control':'no-cache'}});
assert.equal(response.status,200,'Public Earthline homepage is not HTTP 200');
const actual=await response.text();
const sha=s=>createHash('sha256').update(s).digest('hex');
const anchors=['earthlineSwalePolylineM102(pts)','rawLatM89','earthline-elder-restored-17097.js','earthlineRestoreNativeNavigation15779'];
const info={origin,status:response.status,remoteBytes:Buffer.byteLength(actual),localBytes:Buffer.byteLength(expected),
remoteSha256:sha(actual),localSha256:sha(expected),sameBytes:actual===expected,
anchors:Object.fromEntries(anchors.map(s=>[s,{live:actual.includes(s),branch:expected.includes(s)}])),
cacheControl:response.headers.get('cache-control'),server:response.headers.get('server')};
console.log('M119_DEPLOYMENT_PARITY',JSON.stringify(info));
assert.equal(actual,expected,'Published Earthline HTML does not match pages-live baseline; further UI fixes may not reach public');
