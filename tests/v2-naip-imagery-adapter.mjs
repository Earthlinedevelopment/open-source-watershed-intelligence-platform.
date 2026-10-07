import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../v2/naip-imagery-adapter.js', import.meta.url), 'utf8');
const mod = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

assert.equal(mod.EARTHLINE_V2_NAIP.blocking, false);
assert.equal(mod.EARTHLINE_V2_NAIP.defaultWidth, 1400);
assert.equal(mod.EARTHLINE_V2_NAIP.defaultHeight, 840);

const sample = [-73.015, 44.512, -73.011, 44.516];
const u = new URL(mod.buildNaipExportUrl(sample));
assert.equal(u.hostname, 'apps.geo.fpac.usda.gov');
assert.equal(u.searchParams.get('bboxSR'), '4326');
assert.equal(u.searchParams.get('imageSR'), '4326');
assert.equal(u.searchParams.get('size'), '1400,840');
assert.equal(u.searchParams.get('f'), 'image');

const clamped = new URL(mod.buildNaipExportUrl(sample, 99999, 1));
assert.equal(clamped.searchParams.get('size'), '1800,256');

assert.throws(() => mod.buildNaipExportUrl([0, 0, 0, 1]), /invalid bounds/);

if (process.env.EARTHLINE_NAIP_LIVE === '1') {
  const probes = {
    VT: [-73.015, 44.512, -73.011, 44.516],
    TX: [-97.745, 30.265, -97.741, 30.269],
    CA: [-121.496, 38.579, -121.492, 38.583]
  };
  const rows = [];
  for (const [region, bounds] of Object.entries(probes)) {
    const url = mod.buildNaipExportUrl(bounds, 1400, 840);
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 10000);
    const started = performance.now();
    try {
      const response = await fetch(url, { signal: ctl.signal, cache: 'no-store' });
      const bytes = (await response.arrayBuffer()).byteLength;
      const ms = Math.round(performance.now() - started);
      assert.equal(response.ok, true, region + ' NAIP HTTP');
      assert.ok(bytes > 1000, region + ' NAIP image payload');
      assert.ok(ms < 10000, region + ' NAIP live request under 10s probe ceiling');
      rows.push({ region, ms, bytes, contentType: response.headers.get('content-type') });
    } finally {
      clearTimeout(timer);
    }
  }
  console.log('EARTHLINE_V2_NAIP_LIVE ' + JSON.stringify({ status: 'PASS', rows }));
} else {
  console.log('Earthline V2 NAIP adapter contract: PASS');
}
