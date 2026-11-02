// Earthline Mantra 85 — unified deterministic science engine.
// This engine does not invent recharge, forest, or ranking science. Those arrive as explicit, fingerprinted inputs/policies.

import {LOCKED_SCIENCE,deepFreeze,assertSameIdentity} from './mantra85-contract.mjs';
import {hydrology} from './mantra85-hydrology.mjs';
import {generateContours} from './mantra85-contours.mjs';
import {buildCandidates,selectCandidates} from './mantra85-candidates.mjs';
export const ENGINE_VERSION='m85-engine-2';

export function buildScienceBundle({request,identity,acquired}){
  assertSameIdentity(identity,{...identity,target:request.target,extent:request.extent,runId:request.runId,mode:request.mode,requestFingerprint:request.requestFingerprint});
  if(!acquired||String(acquired.acquisitionFingerprint)!==String(identity.acquisitionFingerprint))throw new Error('acquisition identity mismatch');
  const {width,height,elevation}=acquired.dem||{};
  if(!Number.isInteger(width)||!Number.isInteger(height)||!elevation||elevation.length!==width*height)throw new Error('DEM required');
  const N=width*height;
  const cellXM=Number(acquired.cellXM),cellYM=Number(acquired.cellYM);
  if(!Number.isFinite(cellXM)||!Number.isFinite(cellYM)||cellXM<=0||cellYM<=0)throw new Error('cell dimensions required');

  const rechargeGrid=acquired.rechargeGrid;
  if(request.policy.requireRechargeGrid&&(!rechargeGrid||rechargeGrid.length!==N))throw new Error('authoritative recharge grid required');
  const forestNoBuildMask=acquired.forestNoBuildMask;
  if(request.policy.requireForestExclusion&&(!forestNoBuildMask||forestNoBuildMask.length!==N))throw new Error('proven forest exclusion mask required');

  const hydro=hydrology(elevation,width,height,{validMask:acquired.validMask||null,cellXM,cellYM});
  const contours=generateContours({elevation:hydro.filled,width,height,extent:request.extent,intervalM:request.policy.contourIntervalM,validMask:acquired.validMask||null});
  const masks={
    validMask:acquired.validMask||null,
    roadOrDriveway:acquired.roadOrDrivewayMask||null,
    structureOrImpervious:acquired.structureMask||null,
    water:acquired.waterMask||null,
    majorChannel:acquired.majorChannelMask||null,
    manualNoBuild:acquired.manualNoBuildMask||null
  };
  const candidates=buildCandidates({contours,width,height,extent:request.extent,hydrology:hydro,rechargeGrid,masks,forestNoBuildMask,policy:request.policy});
  const swales=selectCandidates(candidates,{maxSwales:request.policy.maxSwales,minSpacingM:request.policy.minSpacingM,rankingPolicy:request.policy.rankingPolicy});
  const bundle={
    engineVersion:ENGINE_VERSION,identity,runId:identity.runId,mode:identity.mode,target:identity.target,extent:identity.extent,policy:request.policy,
    dem:{source:String(acquired.dem.source||'unknown'),resolutionM:Number(acquired.dem.resolutionM||Math.max(cellXM,cellYM)),width,height},
    hydrology:{version:hydro.version,fillEpsilonM:hydro.fillEpsilonM},
    contours,candidates,swales,
    recharge:deepFreeze({status:String(acquired.rechargeEvidence?.status||'ready'),policyId:String(acquired.rechargeEvidence?.policyId||'unknown'),weights:LOCKED_SCIENCE.rechargeWeights}),
    forest:deepFreeze(acquired.forestEvidence||{status:request.policy.requireForestExclusion?'pending':'unavailable'}),
    waterPaths:deepFreeze(acquired.waterPaths||[]),
    aquifer:deepFreeze(acquired.aquiferEvidence||{status:'unavailable'}),
    elder:deepFreeze(acquired.elderEvidence||{status:'unavailable',rechargeWeight:0}),
    coverage:deepFreeze(acquired.coverage||{status:'unknown'}),
    exclusions:deepFreeze(acquired.exclusionEvidence||{status:'unknown'})
  };
  return deepFreeze(bundle);
}
