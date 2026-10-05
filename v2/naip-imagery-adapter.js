/*
Earthline Version 2 — USDA NAIP report/property imagery adapter.
NOT loaded by production. Branch: version-2.

This is presentation/context only. Core Earthline hydrology must never wait on it.
*/

export const EARTHLINE_V2_NAIP = Object.freeze({
  sourceId: 'usda-naip-conus',
  title: 'USDA National Agriculture Imagery Program (NAIP)',
  imageServer: 'https://apps.geo.fpac.usda.gov/geo-imagery/rest/services/naip/conus_naip/ImageServer',
  coverage: 'CONUS',
  blocking: false,
  defaultWidth: 1400,
  defaultHeight: 840
});

function validBounds(b) {
  return Array.isArray(b) && b.length === 4 && b.every(Number.isFinite) &&
    b[0] < b[2] && b[1] < b[3] &&
    b[0] >= -180 && b[2] <= 180 && b[1] >= -90 && b[3] <= 90;
}

export function buildNaipExportUrl(bounds, width = 1400, height = 840) {
  if (!validBounds(bounds)) throw new Error('Earthline V2 NAIP: invalid bounds');
  const w = Math.max(256, Math.min(1800, Math.round(width)));
  const h = Math.max(256, Math.min(1050, Math.round(height)));
  const params = new URLSearchParams({
    bbox: bounds.join(','),
    bboxSR: '4326',
    imageSR: '4326',
    size: `${w},${h}`,
    format: 'jpgpng',
    interpolation: 'RSP_BilinearInterpolation',
    compressionQuality: '80',
    f: 'image'
  });
  return `${EARTHLINE_V2_NAIP.imageServer}/exportImage?${params.toString()}`;
}

export async function loadNaipImage(bounds, options = {}) {
  const url = buildNaipExportUrl(bounds, options.width, options.height);
  const ctl = new AbortController();
  const timeoutMs = Math.max(1000, Math.min(7000, Number(options.timeoutMs) || 5000));
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      mode: 'cors',
      cache: 'force-cache',
      signal: ctl.signal
    });
    if (!response.ok) throw new Error(`NAIP HTTP ${response.status}`);
    return await response.blob();
  } finally {
    clearTimeout(timer);
  }
}
