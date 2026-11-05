import {deriveTerrainFlow,routedFlowSegments} from './terrain-flow.mjs';
import {certifyRasterCandidate} from './raster-audit.mjs';

/**
 * Source-backed raster analysis coordinator, not a swale generator.
 * Only preapproved contour/runoff candidates may be supplied.
 */
const text = s => typeof s==='string' && s.trim().length>0;
const verified = s => s?.status==='verified'&&text(s.dataset)&&text(s.version)&&text(s.coverageId);

export function publishRasterAnalysis(owner,token,{grid,runoff,candidate,projectLonLat}={}){
  if(!owner?.isCurrent?.(token))return {accepted:false,status:'stale'};
  const fail = errors => owner.fail(token,errors);
  if(!candidate||candidate.runId!==token.id||candidate.tier!==token.tier)
    return fail(['CANDIDATE_RUN_ID_OR_TIER_INVALID']);
  if(!grid||!text(grid.gridId)||!verified(candidate.sources?.terrain)||
     candidate.sources.terrain.coverageId!==grid.gridId)
    return fail(['TERRAIN_COVERAGE_NOT_BOUND_TO_RUN']);
  if(!verified(candidate.sources?.exclusions)||
     candidate.sources.exclusions.fingerprint!==grid.maskFingerprint)
    return fail(['EXCLUSION_MASK_NOT_BOUND_TO_RUN']);
  if(!verified(candidate.sources?.hydrography))
    return fail(['HYDROGRAPHY_SOURCE_NOT_VERIFIED']);
  if(!verified(candidate.sources?.landCover))
    return fail(['LAND_COVER_SOURCE_NOT_VERIFIED']);
  if(!verified(runoff)||!text(runoff.modelSourceId)||
     !text(runoff.period)||!Number.isFinite(runoff.depthM)||runoff.depthM<=0)
    return fail(['RUNOFF_MODEL_COVERAGE_OR_PERIOD_NOT_VERIFIED']);
  // A positive rainfall number alone is not proof of hydrology coverage.
  if(runoff.coverageId!==candidate.sources.hydrography.coverageId)
    return fail(['RUNOFF_HYDROGRAPHY_COVERAGE_MISMATCH']);
  if(typeof projectLonLat!=='function')
    return fail(['PROJECTION_ADAPTER_UNAVAILABLE']);
  const routing=deriveTerrainFlow(grid);
  if(routing.status!=='derived')return fail(routing.errors);
  if(!owner.isCurrent(token))return {accepted:false,status:'stale'};
  const flows=routedFlowSegments(grid,routing,{
    runoffDepthM:runoff.depthM,modelSourceId:runoff.modelSourceId});
  if(flows.status!=='derived')return fail(flows.errors);
  if(!owner.isCurrent(token))return {accepted:false,status:'stale'};
  const certified=certifyRasterCandidate(candidate,{
    grid,flowSegments:flows.segments,flowModelId:flows.modelSourceId,projectLonLat});
  if(certified.status!=='audited')return fail(certified.errors);
  if(!owner.isCurrent(token))return {accepted:false,status:'stale'};
  // Owner publication rechecks the evidence contract and freezes output.
  return owner.publish(token,certified.candidate);
}
