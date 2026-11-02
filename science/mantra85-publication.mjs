// Earthline Mantra 85 — fail-closed publication gate.

import {LOCKED_SCIENCE,assertSameIdentity,deepFreeze,stableHash} from './mantra85-contract.mjs';
import {polylineLengthM} from './mantra85-candidates.mjs';
export const PUBLICATION_VERSION='m85-publication-1';

function pending(v){return String(v?.status||'').toLowerCase()==='pending';}
function failed(v){const s=String(v?.status||'').toLowerCase();return s==='failed'||s==='error'||s==='blocking-failed';}
export function validateForPublication(bundle){
  if(!bundle?.identity)throw new Error('missing immutable run identity');assertSameIdentity(bundle.identity,bundle.identity);
  if(bundle.runId!==bundle.identity.runId||bundle.mode!==bundle.identity.mode)throw new Error('bundle identity divergence');
  if(stableHash(bundle.target)!==stableHash(bundle.identity.target)||stableHash(bundle.extent)!==stableHash(bundle.identity.extent))throw new Error('bundle target/extent divergence');
  if(bundle.elder?.rechargeWeight!==LOCKED_SCIENCE.elderRechargeWeight)throw new Error('elder recharge weight must be zero');
  if(bundle.policy.requireNoPendingEvidence&&(pending(bundle.elder)||pending(bundle.aquifer)||pending(bundle.exclusions)||pending(bundle.coverage)||pending(bundle.forest)||pending(bundle.recharge)))throw new Error('pending evidence cannot be published');
  if(failed(bundle.elder)||failed(bundle.aquifer)||failed(bundle.exclusions)||failed(bundle.coverage)||failed(bundle.forest)||failed(bundle.recharge))throw new Error('failed required evidence cannot be published');
  for(const s of bundle.swales||[]){
    const lengthM=polylineLengthM(s.coordinates||[]);if(lengthM>bundle.policy.maxCandidateLengthM+.01)throw new Error('swale exceeds local candidate length invariant');
    if(Number(s.maxSlopePct)>LOCKED_SCIENCE.maxSwaleSlopePct)throw new Error('swale violates 4% rule');
    if(!Array.isArray(s.samples)||!s.samples.length)throw new Error('swale missing dense validity samples');
    for(const p of s.samples){if(!p.insideBoundary)throw new Error('swale outside analysis boundary');if(Number(p.slopePct)>LOCKED_SCIENCE.maxSwaleSlopePct)throw new Error('swale sample violates 4% rule');if(p.roadOrDriveway||p.structureOrImpervious||p.water||p.majorChannel||p.manualNoBuild)throw new Error('swale intersects exclusion');if(p.forestNoBuild)throw new Error('swale intersects forest exclusion');}
  }
  return true;
}

export function publishableSnapshot(bundle){validateForPublication(bundle);return deepFreeze({publicationVersion:PUBLICATION_VERSION,identity:bundle.identity,runId:bundle.runId,engineVersion:bundle.engineVersion,mode:bundle.mode,target:bundle.target,extent:bundle.extent,policy:bundle.policy,dem:bundle.dem,hydrology:bundle.hydrology,contours:bundle.contours,swales:bundle.swales,waterPaths:bundle.waterPaths,aquifer:bundle.aquifer,elder:bundle.elder,coverage:bundle.coverage,forest:bundle.forest,recharge:bundle.recharge,exclusions:bundle.exclusions});}
