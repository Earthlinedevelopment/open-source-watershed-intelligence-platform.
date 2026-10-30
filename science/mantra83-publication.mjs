// Mantra 83 forensic publication gate — NON-PRODUCTION.
// Validates a completed science bundle before any renderer may consume it.

import {assertRunBundle,SWALE} from './mantra83-core.mjs';

export const PUBLICATION_VERSION='m83-publication-1';

export function validateForPublication(bundle){
  assertRunBundle(bundle);
  if(!bundle.engineVersion)throw new Error('missing engine version');
  if(!bundle.hydrology?.version)throw new Error('missing hydrology version');
  if(!bundle.target||!Number.isFinite(bundle.target.lat)||!Number.isFinite(bundle.target.lng))throw new Error('invalid target');
  if(!Array.isArray(bundle.extent)||bundle.extent.length!==4)throw new Error('invalid extent');
  if(bundle.elder?.rechargeWeight!==0)throw new Error('elder recharge weight must be zero');

  for(const s of bundle.swales||[]){
    if(Number(s.maxSlopePct)>SWALE.maxSlopePct)throw new Error('swale violates 4% rule');
    if(!Array.isArray(s.samples)||!s.samples.length)throw new Error('swale missing samples');
    for(const p of s.samples){
      if(Number(p.slopePct)>SWALE.maxSlopePct)throw new Error('swale sample violates 4% rule');
      if(p.roadOrDriveway||p.structureOrImpervious||p.water||p.majorChannel||p.manualNoBuild)throw new Error('swale intersects exclusion');
      if(p.canopyKnown!==false&&Number(p.canopyScore)>SWALE.forestCanopyGate)throw new Error('swale intersects dense forest gate');
    }
  }
  return true;
}

export function publishableSnapshot(bundle){
  validateForPublication(bundle);
  return Object.freeze({
    publicationVersion:PUBLICATION_VERSION,
    runId:bundle.runId,
    engineVersion:bundle.engineVersion,
    mode:bundle.mode,
    target:Object.freeze({...bundle.target}),
    extent:Object.freeze([...bundle.extent]),
    rules:Object.freeze({...bundle.rules}),
    swales:Object.freeze([...(bundle.swales||[])]),
    waterPaths:Object.freeze([...(bundle.waterPaths||[])]),
    contours:Object.freeze([...(bundle.contours||[])]),
    aquifer:bundle.aquifer,
    elder:bundle.elder,
    coverage:bundle.coverage,
    hydrologyVersion:bundle.hydrology.version,
    dem:Object.freeze({...bundle.dem})
  });
}
