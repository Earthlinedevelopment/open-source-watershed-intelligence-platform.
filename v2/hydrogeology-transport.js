/*
Earthline Version 2 — deterministic USGS 2025 hydrogeology transport owner.
NOT loaded by production. Branch: version-2.

Transport only:
- selects exact-geometry 5x5 shards by requested map/analysis bounds;
- does not classify or reinterpret hydrogeologic features;
- does not invent geometry when transport fails.
*/

export const EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT = Object.freeze({
  sourceId: 'usgs-hydrogeologic-regions-2025',
  transportId: '5x5-exact-geometry-shards',
  indexPath: 'v2/data/usgs-hydrogeology-2025/shards-5x5/index.json',
  gridDegrees: 5,
  expectedShards: 50,
  expectedPolygonParts: 5632,
  expectedVertices: 1006860,
  maxConcurrent: 4,
  defaultTimeoutMs: 7000,
  fallbackPolicy: 'return-unavailable-and-let-approved-source-priority-fall-back'
});

function finiteNumber(v) {
  return typeof v === 'number' && Number.isFinite(v);
}

export function validHydrogeologyBounds(bounds) {
  return Array.isArray(bounds) &&
    bounds.length === 4 &&
    bounds.every(finiteNumber) &&
    bounds[0] < bounds[2] &&
    bounds[1] < bounds[3] &&
    bounds[0] >= -180 && bounds[2] <= 180 &&
    bounds[1] >= -90 && bounds[3] <= 90;
}

export function hydrogeologyBboxIntersects(a, b) {
  if (!validHydrogeologyBounds(a) || !validHydrogeologyBounds(b)) return false;
  return !(a[2] < b[0] || a[0] > b[2] || a[3] < b[1] || a[1] > b[3]);
}

export function validateHydrogeologyShardIndex(index) {
  const counts = index?.counts || {};
  const geometry = index?.geometry || {};
  const shards = Array.isArray(index?.shards) ? index.shards : [];
  const valid =
    index?.earthline_asset === 'usgs-hydrogeologic-regions-2025-transport' &&
    Number(index?.grid_degrees) === EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT.gridDegrees &&
    Number(counts.shards) === EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT.expectedShards &&
    Number(counts.polygon_parts) === EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT.expectedPolygonParts &&
    Number(counts.vertices) === EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT.expectedVertices &&
    geometry.simplified === false &&
    geometry.coordinate_rounding === false &&
    geometry.parts_preserved_exactly_once === true &&
    shards.length === EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT.expectedShards &&
    shards.every(s => typeof s?.file === 'string' && validHydrogeologyBounds(s?.bbox));

  return {
    valid,
    reason: valid ? 'verified-exact-shard-index' : 'invalid-or-drifted-shard-index'
  };
}

export function selectHydrogeologyShards(index, bounds) {
  if (!validHydrogeologyBounds(bounds)) {
    throw new Error('Earthline V2 hydrogeology transport: invalid bounds');
  }
  const validation = validateHydrogeologyShardIndex(index);
  if (!validation.valid) {
    throw new Error('Earthline V2 hydrogeology transport: invalid shard index');
  }
  return index.shards
    .filter(shard => hydrogeologyBboxIntersects(shard.bbox, bounds))
    .sort((a, b) => String(a.id).localeCompare(String(b.id)));
}

function resolveUrl(path, baseUrl) {
  const base = baseUrl ||
    (typeof document !== 'undefined' && document.baseURI) ||
    (typeof location !== 'undefined' && location.href) ||
    'https://earthline.invalid/';
  return new URL(path, base).toString();
}

async function fetchJson(url, { fetchImpl, timeoutMs }) {
  const fetcher = fetchImpl || globalThis.fetch;
  if (typeof fetcher !== 'function') throw new Error('fetch unavailable');

  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs) : null;
  try {
    const response = await fetcher(url, {
      cache: 'force-cache',
      signal: ctl?.signal
    });
    if (!response?.ok) throw new Error(`HTTP ${response?.status ?? 'error'}`);
    return await response.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

async function mapLimit(items, limit, worker) {
  const out = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      out[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return out;
}

export async function loadHydrogeologyForBounds(bounds, options = {}) {
  if (!validHydrogeologyBounds(bounds)) {
    return { ok: false, reason: 'invalid-bounds', features: [], shards: [] };
  }

  const timeoutMs = Math.max(
    1000,
    Math.min(15000, Number(options.timeoutMs) || EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT.defaultTimeoutMs)
  );
  const maxConcurrent = Math.max(
    1,
    Math.min(8, Number(options.maxConcurrent) || EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT.maxConcurrent)
  );
  const indexUrl = resolveUrl(
    options.indexPath || EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT.indexPath,
    options.baseUrl
  );

  try {
    const index = options.index || await fetchJson(indexUrl, {
      fetchImpl: options.fetchImpl,
      timeoutMs
    });
    const validation = validateHydrogeologyShardIndex(index);
    if (!validation.valid) {
      return { ok: false, reason: validation.reason, features: [], shards: [] };
    }

    const selected = selectHydrogeologyShards(index, bounds);
    if (!selected.length) {
      return {
        ok: true,
        reason: 'no-usgs-2025-shards-intersect-bounds',
        features: [],
        shards: [],
        bytesPlanned: 0
      };
    }

    const base = new URL(indexUrl);
    base.pathname = base.pathname.replace(/\/[^/]*$/, '/');
    base.search = '';
    base.hash = '';

    const payloads = await mapLimit(selected, maxConcurrent, async shard => {
      const relative = String(shard.file).replace(/^shards-5x5\//, '');
      const url = new URL(relative, base).toString();
      const json = await fetchJson(url, {
        fetchImpl: options.fetchImpl,
        timeoutMs
      });
      if (json?.type !== 'FeatureCollection' || !Array.isArray(json.features)) {
        throw new Error(`invalid shard payload ${shard.id}`);
      }
      return { shard, features: json.features };
    });

    const features = payloads.flatMap(x => x.features);
    return {
      ok: true,
      reason: 'verified-usgs-2025-shards-loaded',
      features,
      shards: selected.map(s => s.id),
      bytesPlanned: selected.reduce((n, s) => n + Number(s.bytes || 0), 0),
      source: EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT.sourceId,
      transport: EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT.transportId
    };
  } catch (error) {
    return {
      ok: false,
      reason: 'hydrogeology-transport-unavailable',
      error: String(error?.message || error),
      features: [],
      shards: []
    };
  }
}

export const EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT_OWNER = Object.freeze({
  config: EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT,
  validHydrogeologyBounds,
  hydrogeologyBboxIntersects,
  validateHydrogeologyShardIndex,
  selectHydrogeologyShards,
  loadHydrogeologyForBounds
});

if (typeof window !== 'undefined') {
  window.EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT_OWNER =
    EARTHLINE_V2_HYDROGEOLOGY_TRANSPORT_OWNER;
}
