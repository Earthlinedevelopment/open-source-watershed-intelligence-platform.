/*
Earthline V2 — Elder runtime contract.
Pure adapter only: no listeners, timers, polling, map ownership, or science changes.
The approved 17118 engine remains the evidence owner.
*/

export const EARTHLINE_V2_ELDER = Object.freeze({
  scienceBaseline: '17118',
  method: 'earthline-elder-tree-aoi-chmv2-v0.7-high-recall-plateau-collapse',
  rechargeWeight: 0,
  dynamicPropertyDatasetId: 'dynamic-property-17130'
});

export function elderRuntime(win = globalThis.window) {
  return win?.EARTHLINE_ELDER_TREES_V2_17118 || null;
}

export function elderLast(win = globalThis.window) {
  return win?.EARTHLINE_ELDER_TREE_LAST_17097 || null;
}

export function elderSnapshot(win = globalThis.window) {
  const runtime = elderRuntime(win);
  const last = elderLast(win);
  const ids = Array.isArray(last?.summary?.coverageDatasetIds)
    ? last.summary.coverageDatasetIds.slice()
    : [];
  return Object.freeze({
    available: !!runtime,
    scienceBaseline: EARTHLINE_V2_ELDER.scienceBaseline,
    method: EARTHLINE_V2_ELDER.method,
    rechargeWeight: EARTHLINE_V2_ELDER.rechargeWeight,
    featureCount: Number(last?.featureCount || 0),
    candidatePoolCount: Number(last?.dynamicCandidatePoolCount || 0),
    coverageDatasetIds: Object.freeze(ids),
    error: last?.dynamicError || last?.error || null,
    at: last?.at || null
  });
}

export function propertyElderFreshForRun(runAudit, last) {
  if (!runAudit || runAudit.result !== true || runAudit.scientificResult !== true) return false;
  const ids = Array.isArray(last?.summary?.coverageDatasetIds)
    ? last.summary.coverageDatasetIds
    : [];
  const elderAt = Date.parse(last?.at || '');
  const runStarted = Date.parse(runAudit?.startedAt || '');
  return ids.includes(EARTHLINE_V2_ELDER.dynamicPropertyDatasetId)
    && Number(last?.featureCount || 0) > 0
    && Number(last?.dynamicCandidatePoolCount || 0) > 0
    && Number.isFinite(elderAt)
    && Number.isFinite(runStarted)
    && elderAt >= runStarted;
}

export const EARTHLINE_V2_ELDER_RUNTIME = Object.freeze({
  config: EARTHLINE_V2_ELDER,
  runtime: elderRuntime,
  last: elderLast,
  snapshot: elderSnapshot,
  propertyFreshForRun: propertyElderFreshForRun
});
