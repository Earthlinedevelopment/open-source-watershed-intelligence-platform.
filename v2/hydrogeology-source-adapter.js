/*
Earthline Version 2 — USGS 2025 Hydrogeologic Regions adapter.
NOT loaded by production. Branch: version-2.

Verified official source schema (2026-10-05):
- HR_Type: PA | SHR
- HR_Name
- HR_Code
- HR_ID
- HR_Litholo
- 126 source polygons in HydrogeologicRegions.shp

Scientific ownership:
- PA = Principal Aquifer.
- SHR = Secondary Hydrogeologic Region.
- Never relabel an SHR as an aquifer.
- A malformed/unknown source type remains generic hydrogeologic context.
*/

export const EARTHLINE_V2_HYDROGEOLOGY = Object.freeze({
  sourceId: 'usgs-hydrogeologic-regions-2025',
  title: 'Hydrogeologic regions of the conterminous United States',
  doi: '10.5066/P1F39LHM',
  scienceBaseItemId: '6863356fd4be025653d31f4d',
  archiveName: 'HydrogeologicRegions.zip',
  releaseDate: '2025-12-19',
  sourceRecordCount: 126,
  boundaryClass: 'national hydrogeologic-region extent — regional context, not a parcel boundary',
  schema: Object.freeze({
    type: 'HR_Type',
    name: 'HR_Name',
    code: 'HR_Code',
    id: 'HR_ID',
    lithology: 'HR_Litholo'
  }),
  allowedTypes: Object.freeze(['PA', 'SHR'])
});

function stringValue(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

export function validateHydrogeologicRegionProperties(properties = {}) {
  const s = EARTHLINE_V2_HYDROGEOLOGY.schema;
  const missing = [];
  for (const key of Object.values(s)) {
    if (!stringValue(properties?.[key])) missing.push(key);
  }

  const rawType = stringValue(properties?.[s.type]).toUpperCase();
  const typeValid = EARTHLINE_V2_HYDROGEOLOGY.allowedTypes.includes(rawType);

  return {
    valid: missing.length === 0 && typeValid,
    rawType,
    missing,
    reason: missing.length
      ? 'missing-required-usgs-fields'
      : typeValid
        ? 'verified-usgs-schema'
        : 'unknown-usgs-hr-type'
  };
}

export function classifyHydrogeologicRegion(properties = {}) {
  const rawType = stringValue(
    properties?.[EARTHLINE_V2_HYDROGEOLOGY.schema.type]
  ).toUpperCase();

  if (rawType === 'PA') return 'principal_aquifer';
  if (rawType === 'SHR') return 'secondary_hydrogeologic_region';
  return 'hydrogeologic_region';
}

export function normalizeHydrogeologicRegionFeature(feature) {
  if (!feature || feature.type !== 'Feature' || !feature.geometry) return null;

  const p = feature.properties || {};
  const s = EARTHLINE_V2_HYDROGEOLOGY.schema;
  const validation = validateHydrogeologicRegionProperties(p);
  const classification = classifyHydrogeologicRegion(p);

  const name = stringValue(p[s.name]) || 'USGS hydrogeologic region';
  const code = stringValue(p[s.code]) || null;
  const id = stringValue(p[s.id]) || null;
  const lithology = stringValue(p[s.lithology]) || null;

  return {
    type: 'Feature',
    geometry: feature.geometry,
    properties: {
      ...p,
      name,
      earthline_context_class: classification,
      earthline_source_type: validation.rawType || null,
      earthline_source_code: code,
      earthline_source_id: id,
      earthline_lithology: lithology,
      earthline_source_schema_valid: validation.valid,
      earthline_source_schema_reason: validation.reason,
      earthline_source: EARTHLINE_V2_HYDROGEOLOGY.title,
      earthline_source_doi: EARTHLINE_V2_HYDROGEOLOGY.doi,
      earthline_boundary_class: EARTHLINE_V2_HYDROGEOLOGY.boundaryClass
    }
  };
}

export function normalizeHydrogeologicRegionsGeoJSON(input) {
  const features = Array.isArray(input?.features) ? input.features : [];
  return {
    type: 'FeatureCollection',
    features: features.map(normalizeHydrogeologicRegionFeature).filter(Boolean)
  };
}
