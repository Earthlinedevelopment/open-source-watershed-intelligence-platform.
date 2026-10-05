/*
Earthline Version 2 — Hydrogeologic Regions adapter scaffold.
NOT loaded by production. Branch: version-2.

Purpose:
- normalize the 2025 USGS National Extent Hydrogeologic Framework data
- preserve whether a feature is a Principal Aquifer (PA) or Secondary Hydrogeologic Region (SHR)
- keep one authoritative groundwater-context owner
*/

export const EARTHLINE_V2_HYDROGEOLOGY = Object.freeze({
  sourceId: 'usgs-hydrogeologic-regions-2025',
  title: 'Hydrogeologic regions of the conterminous United States',
  doi: '10.5066/P1F39LHM',
  releaseDate: '2025-12-19',
  boundaryClass: 'national hydrogeologic-region extent — regional context, not a parcel boundary'
});

function firstValue(properties, keys) {
  for (const key of keys) {
    const value = properties?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') return value;
  }
  return null;
}

export function classifyHydrogeologicRegion(properties = {}) {
  const rawClass = String(firstValue(properties, [
    'HR_TYPE','HR_CLASS','TYPE','CLASS','SOURCE_TYPE','REGION_TYPE','FEATURE_TYPE'
  ]) ?? '').trim();

  const rawName = String(firstValue(properties, [
    'HR_NAME','NAME','REGION_NAME','AQ_NAME','SHR_NAME'
  ]) ?? '').trim();

  const haystack = (rawClass + ' ' + rawName).toLowerCase();
  if (/principal\s+aquifer|\bpa\b/.test(haystack)) return 'principal_aquifer';
  if (/secondary\s+hydrogeologic|\bshr\b/.test(haystack)) return 'secondary_hydrogeologic_region';
  return 'hydrogeologic_region';
}

export function normalizeHydrogeologicRegionFeature(feature) {
  if (!feature || feature.type !== 'Feature' || !feature.geometry) return null;
  const p = feature.properties || {};
  const classification = classifyHydrogeologicRegion(p);
  const name = String(firstValue(p, [
    'HR_NAME','NAME','REGION_NAME','AQ_NAME','SHR_NAME'
  ]) ?? 'USGS hydrogeologic region').trim();

  return {
    type: 'Feature',
    geometry: feature.geometry,
    properties: {
      ...p,
      name,
      earthline_context_class: classification,
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
