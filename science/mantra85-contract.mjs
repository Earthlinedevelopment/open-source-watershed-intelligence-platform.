// Earthline Mantra 85 — Clock Architecture contract.
// Pure invariants and immutable run identity. No DOM, Mapbox, timers, network I/O, or browser state.

export const SCIENCE_VERSION = 'm85-clock-1';
export const CONTRACT_VERSION = 'm85-contract-1';

export const LOCKED_SCIENCE = Object.freeze({
  maxSwaleSlopePct: 4,
  propertyTargetSpacingM: 6.096,
  propertyMinSpacingM: 4.572,
  propertyMaxSpacingM: 7.620,
  elderRechargeWeight: 0,
  forestCanopyGate: 0.40,
  rechargeWeights: Object.freeze({aquifer:0.30, soil:0.20, slope:0.18, flow:0.17, climate:0.15})
});

export function clamp01(v){
  v=Number(v);
  return Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
}

export function deepFreeze(v){
  if(!v || typeof v!=='object' || Object.isFrozen(v) || ArrayBuffer.isView(v)) return v;
  for(const k of Object.keys(v)) deepFreeze(v[k]);
  return Object.freeze(v);
}

function canonical(v){
  if(v===null) return 'null';
  const t=typeof v;
  if(t==='number'){
    if(!Number.isFinite(v)) throw new Error('non-finite value in canonical identity');
    return Object.is(v,-0)?'0':String(v);
  }
  if(t==='string') return JSON.stringify(v);
  if(t==='boolean') return v?'true':'false';
  if(Array.isArray(v)) return '['+v.map(canonical).join(',')+']';
  if(t==='object'){
    const keys=Object.keys(v).sort();
    return '{'+keys.map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
  }
  throw new Error('unsupported canonical identity value');
}

export function stableHash(v){
  const s=typeof v==='string'?v:canonical(v);
  let h=0xcbf29ce484222325n;
  const p=0x100000001b3n;
  const mask=0xffffffffffffffffn;
  for(let i=0;i<s.length;i++){
    const cp=s.codePointAt(i);
    h^=BigInt(cp);
    h=(h*p)&mask;
    if(cp>0xffff)i++;
  }
  return h.toString(16).padStart(16,'0');
}

export function normalizeTarget(target){
  const lat=Number(target?.lat),lng=Number(target?.lng??target?.lon);
  if(!Number.isFinite(lat)||!Number.isFinite(lng)||lat<-90||lat>90||lng<-180||lng>180) throw new Error('invalid target');
  return Object.freeze({lat,lng});
}

export function normalizeExtent(extent){
  if(!Array.isArray(extent)||extent.length!==4) throw new Error('extent required');
  const e=extent.map(Number);
  if(e.some(x=>!Number.isFinite(x))) throw new Error('invalid extent');
  const [w,s,ee,n]=e;
  if(!(s<n) || !(w<ee) || s<-90 || n>90 || w<-180 || ee>180) throw new Error('invalid extent bounds');
  return Object.freeze(e);
}

export function createRunRequest({runId,mode,target,extent,policy,sourcePlanVersion='unknown'}){
  if(!runId) throw new Error('runId required');
  mode=String(mode||'').toLowerCase();
  if(mode!=='property'&&mode!=='regional') throw new Error('mode must be property or regional');
  const t=normalizeTarget(target),e=normalizeExtent(extent);
  if(t.lng<e[0]||t.lng>e[2]||t.lat<e[1]||t.lat>e[3]) throw new Error('target outside declared extent');
  if(!policy||typeof policy!=='object') throw new Error('explicit policy required');
  const p={
    contourIntervalM:Number(policy.contourIntervalM),
    minCandidateLengthM:Number(policy.minCandidateLengthM),
    maxCandidateLengthM:Number(policy.maxCandidateLengthM),
    sampleStepM:Number(policy.sampleStepM),
    minSpacingM:Number(policy.minSpacingM),
    maxSwales:Number(policy.maxSwales),
    maxSlopePct:LOCKED_SCIENCE.maxSwaleSlopePct,
    forestCanopyGate:LOCKED_SCIENCE.forestCanopyGate,
    requireNoPendingEvidence:policy.requireNoPendingEvidence!==false
  };
  for(const k of ['contourIntervalM','minCandidateLengthM','maxCandidateLengthM','sampleStepM','minSpacingM','maxSwales']){
    if(!Number.isFinite(p[k])||p[k]<=0) throw new Error('invalid policy '+k);
  }
  if(p.minCandidateLengthM>p.maxCandidateLengthM) throw new Error('candidate length policy inverted');
  const fingerprint=stableHash({runId:String(runId),mode,target:t,extent:e,policy:p,sourcePlanVersion:String(sourcePlanVersion),scienceVersion:SCIENCE_VERSION});
  return deepFreeze({runId:String(runId),mode,target:t,extent:e,policy:deepFreeze(p),sourcePlanVersion:String(sourcePlanVersion),requestFingerprint:fingerprint,scienceVersion:SCIENCE_VERSION});
}

export function createRunIdentity(request,acquisitionFingerprint){
  if(!request?.requestFingerprint) throw new Error('validated run request required');
  if(!acquisitionFingerprint) throw new Error('acquisition fingerprint required');
  const identityFingerprint=stableHash({
    requestFingerprint:request.requestFingerprint,
    acquisitionFingerprint:String(acquisitionFingerprint),
    runId:request.runId,
    mode:request.mode,
    target:request.target,
    extent:request.extent,
    scienceVersion:SCIENCE_VERSION
  });
  return deepFreeze({
    runId:request.runId,
    mode:request.mode,
    target:request.target,
    extent:request.extent,
    requestFingerprint:request.requestFingerprint,
    acquisitionFingerprint:String(acquisitionFingerprint),
    scienceVersion:SCIENCE_VERSION,
    identityFingerprint
  });
}

export function assertSameIdentity(expected,actual){
  if(!expected||!actual) throw new Error('identity missing');
  for(const k of ['runId','mode','requestFingerprint','acquisitionFingerprint','scienceVersion','identityFingerprint']){
    if(String(expected[k])!==String(actual[k])) throw new Error('identity mismatch: '+k);
  }
  if(stableHash(expected.target)!==stableHash(actual.target)) throw new Error('identity mismatch: target');
  if(stableHash(expected.extent)!==stableHash(actual.extent)) throw new Error('identity mismatch: extent');
  return true;
}
