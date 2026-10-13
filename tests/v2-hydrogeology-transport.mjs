import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const source = await readFile(new URL('../v2/hydrogeology-transport.js', import.meta.url), 'utf8');
const mod = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const index = JSON.parse(await readFile(
  new URL('../v2/data/usgs-hydrogeology-2025/shards-5x5/index.json', import.meta.url),
  'utf8'
));

assert.equal(mod.validateHydrogeologyShardIndex(index).valid, true);
assert.equal(index.counts.shards, 50);
assert.equal(index.counts.polygon_parts, 5632);
assert.equal(index.counts.vertices, 1006860);
assert.ok(index.max_shard_bytes <= 3100000);

const vt = [-73.44, 42.72, -71.46, 45.02];
const vtShards = mod.selectHydrogeologyShards(index, vt);
assert.ok(vtShards.length > 0);
assert.ok(vtShards.every(s => mod.hydrogeologyBboxIntersects(s.bbox, vt)));

const ocean = [10, -50, 15, -45];
assert.equal(mod.selectHydrogeologyShards(index, ocean).length, 0);

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fakeFetch = async url => {
  const u = new URL(url);
  const rel = u.pathname.replace(/^\//, '');
  const local = path.join(repoRoot, rel);
  try {
    const body = await readFile(local, 'utf8');
    return { ok: true, status: 200, json: async () => JSON.parse(body) };
  } catch {
    return { ok: false, status: 404, json: async () => ({}) };
  }
};

const loaded = await mod.loadHydrogeologyForBounds(vt, {
  baseUrl: 'https://earthline.test/',
  fetchImpl: fakeFetch,
  timeoutMs: 5000
});
assert.equal(loaded.ok, true);
assert.equal(loaded.reason, 'verified-usgs-2025-shards-loaded');
assert.ok(loaded.features.length > 0);
assert.deepEqual(loaded.shards, vtShards.map(s => s.id));
assert.ok(loaded.features.every(f => ['PA', 'SHR'].includes(String(f?.properties?.HR_Type || ''))));

const unavailable = await mod.loadHydrogeologyForBounds(vt, {
  baseUrl: 'https://earthline.test/',
  fetchImpl: async () => ({ ok: false, status: 503, json: async () => ({}) })
});
assert.equal(unavailable.ok, false);
assert.equal(unavailable.reason, 'hydrogeology-transport-unavailable');
assert.deepEqual(unavailable.features, []);

console.log(JSON.stringify({
  status: 'PASS',
  vtShards: loaded.shards,
  vtFeatureParts: loaded.features.length,
  vtBytesPlanned: loaded.bytesPlanned,
  maxShardBytes: index.max_shard_bytes
}));
