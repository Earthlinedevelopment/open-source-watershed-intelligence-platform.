// Earthline Mantra 85 — unified deterministic science engine.

import {LOCKED_SCIENCE,clamp01,deepFreeze,assertSameIdentity} from './mantra85-contract.mjs';
import {hydrology} from './mantra85-hydrology.mjs';
import {generateContours} from './mantra85-contours.mjs';
import {buildCandidates,selectCandidates} from './mantra85-candidates.mjs';
export const ENGINE_VERSION='m85-engine-1';

function rechargeSuitability({aquifer,soil,slopePct,flow,annualPrecipIn=30}){const w=LOCKED_SCIENCE.rechargeWeights,aq=clamp01(aquifer),so=clamp01(soil),sl=clamp01(1-Number(slopePct)/12),fa=clamp01(flow),need=clamp01((45-Number(annualPrecipIn))/40),base=aq*w.aquifer+so*w.soil+sl*w.slope+fa*w.flow+w.climate*.5;return clamp01(base*(.82+need*.33));}

export function buildScienceBundle({request,identity,acquired}){
  assertSameIdentity(identity,{...identity,target:request.target,extent:request.extent,runId:request.runId,mode:request.mode,requestFingerprint:request.requestFingerprint});
  if(!acquired||String(acquired.acquisitionFingerprint)!==String(identity.acquisitionFingerprint))throw new Error('acquisition identity mismatch');
  const {width,height,elevation}=acquired.dem||{};if(!Number.isInteger(width)||!Number.isInteger(height)||!elevation||elevation.length!==width*height)throw new Error('DEM required');
  const cellXM=Number(acquired.cellXM),cellYM=Number(acquired.cellYM);if(!Number.isFinite(cellXM)||!Number.isFinite(cellYM)||cellXM<=0||cellYM<=0)throw new Error('cell dimensions required');
  const hydro=hydrology(elevation,width,height,{validMask:acquired.validMask||null,cellXM,cellYM});
  const rechargeGrid=new Float64Array(width*height);for(let i=0;i<rechargeGrid.length;i++){const slope=hydro.slopePct[i];if(!Number.isFinite(slope)){rechargeGrid[i]=NaN;continue;}const flow=Math.min(1,Math.log1p(Math.max(0,hydro.accumulation[i]))/Math.log1p(Math.max(2,width*height)));rechargeGrid[i]=rechargeSuitability({aquifer:Number(acquired.aquiferGrid?.[i]??acquired.aquiferFallback??0),soil:Number(acquired.soilGrid?.[i]??acquired.soilFallback??0),slopePct:slope,flow,annualPrecipIn:Number(acquired.annualPrecipIn??30)});}
  const contours=generateContours({elevation:hydro.filled,width,height,extent:request.extent,intervalM:request.policy.contourIntervalM,validMask:acquired.validMask||null});
  const masks={validMask:acquired.validMask||null,roadOrDriveway:acquired.roadOrDrivewayMask||null,structureOrImpervious:acquired.structureMask||null,water:acquired.waterMask||null,majorChannel:acquired.majorChannelMask||null,manualNoBuild:acquired.manualNoBuildMask||null};
  const candidates=buildCandidates({contours,width,height,extent:request.extent,hydrology:hydro,rechargeGrid,masks,canopyGrid:acquired.canopyGrid||null,policy:request.policy});
  const swales=selectCandidates(candidates,{maxSwales:request.policy.maxSwales,minSpacingM:request.policy.minSpacingM});
  const bundle={engineVersion:ENGINE_VERSION,identity,runId:identity.runId,mode:identity.mode,target:identity.target,extent:identity.extent,policy:request.policy,dem:{source:String(acquired.dem.source||'unknown'),resolutionM:Number(acquired.dem.resolutionM||Math.max(cellXM,cellYM)),width,height},hydrology:{version:hydro.version,fillEpsilonM:hydro.fillEpsilonM},contours,swales,recharge:{weights:LOCKED_SCIENCE.rechargeWeights},waterPaths:deepFreeze(acquired.waterPaths||[]),aquifer:deepFreeze(acquired.aquiferEvidence||{status:'unavailable'}),elder:deepFreeze(acquired.elderEvidence||{status:'unavailable',rechargeWeight:0}),coverage:deepFreeze(acquired.coverage||{status:'unknown'}),exclusions:deepFreeze(acquired.exclusionEvidence||{status:'unknown'})};
  return deepFreeze(bundle);
}
