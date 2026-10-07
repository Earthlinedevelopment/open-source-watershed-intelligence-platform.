import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const transportSource = await readFile(path.join(root, 'v2/hydrogeology-transport.js'), 'utf8');
const adapterSource = await readFile(path.join(root, 'v2/hydrogeology-source-adapter.js'), 'utf8');
const transport = await import('data:text/javascript;base64,' + Buffer.from(transportSource).toString('base64'));
const adapter = await import('data:text/javascript;base64,' + Buffer.from(adapterSource).toString('base64'));

const fakeFetch = async url => {
  const u = new URL(url);
  const local = path.join(root, u.pathname.replace(/^\//, ''));
  try {
    const body = await readFile(local, 'utf8');
    return { ok: true, status: 200, json: async () => JSON.parse(body) };
  } catch {
    return { ok: false, status: 404, json: async () => ({}) };
  }
};

const probes = {
  VT: [-73.44, 42.72, -71.46, 45.02],
  AR: [-94.62, 33.00, -89.64, 36.50],
  IA: [-96.64, 40.37, -90.14, 43.50],
  NY: [-79.76, 40.49, -71.85, 45.02],
  MA: [-73.51, 41.24, -69.93, 42.89],
  MD: [-79.49, 37.91, -75.05, 39.72],
  TX: [-106.65, 25.84, -93.51, 36.50],
  CA: [-124.48, 32.53, -114.13, 42.01],
  FL: [-87.64, 24.40, -79.97, 31.00],
  CO: [-109.06, 36.99, -102.04, 41.00]
};

const rows = [];
for (const [region, bounds] of Object.entries(probes)) {
  const loaded = await transport.loadHydrogeologyForBounds(bounds, {
    baseUrl: 'https://earthline.test/',
    fetchImpl: fakeFetch,
    timeoutMs: 5000
  });
  assert.equal(loaded.ok, true, region + ' transport');
  assert.ok(loaded.features.length > 0, region + ' has hydrogeology context');

  const normalized = adapter.normalizeHydrogeologicRegionsGeoJSON({
    type: 'FeatureCollection',
    features: loaded.features
  });
  assert.equal(normalized.features.length, loaded.features.length);
  assert.ok(normalized.features.every(f => f.properties.earthline_source_schema_valid === true));
  assert.ok(normalized.features.every(f =>
    ['principal_aquifer', 'secondary_hydrogeologic_region'].includes(
      f.properties.earthline_context_class
    )
  ));

  const pa = normalized.features.filter(f =>
    f.properties.earthline_context_class === 'principal_aquifer'
  ).length;
  const shr = normalized.features.length - pa;
  assert.ok(pa + shr > 0);

  rows.push({
    region,
    shards: loaded.shards.length,
    bytesPlanned: loaded.bytesPlanned,
    featureParts: normalized.features.length,
    principalAquiferParts: pa,
    secondaryRegionParts: shr
  });
}

console.log('EARTHLINE_V2_REPRESENTATIVE_HYDROGEOLOGY ' + JSON.stringify({
  status: 'PASS',
  regions: rows
}));
