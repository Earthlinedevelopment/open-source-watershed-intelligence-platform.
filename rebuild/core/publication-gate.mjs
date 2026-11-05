import {validatePolyline} from './geometry.mjs';

const REQUIRED_INPUTS = Object.freeze(['terrain', 'hydrography', 'landCover']);
const EXCLUSION_CLASSES = Object.freeze(['roads', 'buildings', 'driveways', 'mappedWater']);
const text = s => typeof s === 'string' && s.trim().length > 0;
const isObject = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const verifiedInput = x => isObject(x) && x.status === 'verified' &&
  text(x.dataset) && text(x.version) && text(x.coverageId);

function validateSwale(swale, exclusions) {
  const errors = [];
  const id = text(swale?.id) ? swale.id : '(missing id)';
  if (!text(swale?.id)) errors.push('SWALE_ID_MISSING');
  errors.push(...validatePolyline(swale?.coordinates));
  const slope = swale?.slopeAudit;
  if (!isObject(slope) || slope.status !== 'verified' ||
      slope.coverage !== 'full-corridor' || !Number.isInteger(slope.checkedCells) ||
      slope.checkedCells < 1 || !Number.isFinite(slope.maxLocalPct) ||
      slope.maxLocalPct < 0 || slope.maxLocalPct > 4)
    errors.push('SLOPE_NOT_VERIFIED_AT_OR_BELOW_4_PCT');
  const flow = swale?.flowAudit;
  if (!isObject(flow) || flow.status !== 'verified' ||
      !Number.isInteger(flow.crossingCount) || flow.crossingCount < 1 ||
      !Number.isFinite(flow.positiveRunoffEvidence) || flow.positiveRunoffEvidence <= 0 ||
      !text(flow.modelSourceId))
    errors.push('POSITIVE_RUNOFF_INTERCEPTION_NOT_VERIFIED');
  const audit = swale?.exclusionAudit;
  if (!isObject(audit) || audit.status !== 'verified' ||
      audit.coverage !== 'full-corridor-footprint' ||
      audit.maskFingerprint !== exclusions?.fingerprint ||
      !text(audit.maskFingerprint) || audit.corridorId !== swale?.id ||
      !Number.isInteger(audit.checkedCells) || audit.checkedCells < 1 ||
      audit.unsafeIntersections !== 0)
    errors.push('EXCLUSION_AUDIT_FAILED');
  return errors.map(code => id + ':' + code);
}
/**
 * Validate an engine-produced candidate without inventing data or geometries.
 * This gate checks independently generated evidence contracts; it does NOT prove
 * that an external GIS engine computed slope, flow or footprints correctly.
 */
export function validatePublication(candidate) {
  const errors = [];
  if (!isObject(candidate)) return {status: 'blocked', errors: ['CANDIDATE_MISSING']};
  if (!text(candidate.runId)) errors.push('RUN_ID_MISSING');
  if (!['regional', 'property'].includes(candidate.tier)) errors.push('TIER_INVALID');
  const sources = candidate.sources;
  for (const name of REQUIRED_INPUTS)
    if (!verifiedInput(sources?.[name])) errors.push(name.toUpperCase() + '_NOT_VERIFIED');
  const exclusions = sources?.exclusions;
  if (!verifiedInput(exclusions) || !text(exclusions?.fingerprint) ||
      !EXCLUSION_CLASSES.every(name => exclusions?.classes?.[name] === 'verified'))
    errors.push('EXCLUSION_MASK_SOURCES_NOT_VERIFIED');
  const swales = candidate.swales;
  if (!Array.isArray(swales)) errors.push('SWALES_INVALID');
  else {
    if (!swales.length && candidate.verifiedZeroOpportunity !== true)
      errors.push('EMPTY_RESULT_UNEXPLAINED');
    const ids = new Set();
    for (const swale of swales) {
      if (text(swale?.id) && ids.has(swale.id)) errors.push(swale.id + ':DUPLICATE_ID');
      if (text(swale?.id)) ids.add(swale.id);
      errors.push(...validateSwale(swale, exclusions));
    }
  }
  const groundwater = candidate.groundwater;
  if (groundwater !== undefined && groundwater !== null) {
    if (!isObject(groundwater) || !['verified', 'unavailable'].includes(groundwater.status))
      errors.push('GROUNDWATER_STATUS_INVALID');
    else if (groundwater.status === 'verified' &&
             (!verifiedInput(groundwater.source) || !Array.isArray(groundwater.evidence)))
      errors.push('GROUNDWATER_EVIDENCE_UNSOURCED');
    else if (groundwater.status === 'unavailable' && groundwater.evidence?.length)
      errors.push('GROUNDWATER_EVIDENCE_MUST_BE_ABSENT');
  }
  if (errors.length) return {status: 'blocked', errors};
  return {status: swales.length ? 'verified' : 'verified-empty', errors: []};
}
