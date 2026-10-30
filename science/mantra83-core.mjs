// Mantra 83 forensic core — NON-PRODUCTION.
// Pure science invariants only. No DOM, Mapbox, globals, timers, or network I/O.

export const SCIENCE_VERSION = 'm83-forensic-1';

export const SWALE = Object.freeze({
  maxSlopePct: 4,
  targetSpacingM: 6.096,
  minSpacingM: 4.572,
  maxSpacingM: 7.620,
  hardInfrastructureBufferM: 6,
  waterBufferM: 2.4,
  majorChannelBufferM: 4,
  forestCanopyGate: 0.40
});

export const RECHARGE_WEIGHTS = Object.freeze({
  aquifer: 0.30,
  soil: 0.20,
  slope: 0.18,
  flow: 0.17,
  climate: 0.15
});

export function clamp01(v){
  v=Number(v);
  return Number.isFinite(v)?Math.max(0,Math.min(1,v)):0;
}

export function slopeComponent(slopePct){
  return clamp01(1-Number(slopePct)/12);
}

export function climateNeed(annualPrecipIn=30){
  return clamp01((45-Number(annualPrecipIn))/40);
}

export function rechargeSuitability({aquifer,soil,slopePct,flow,annualPrecipIn=30}){
  const aq=clamp01(aquifer);
  const so=clamp01(soil);
  const sl=slopeComponent(slopePct);
  const fa=clamp01(flow);
  const need=climateNeed(annualPrecipIn);
  const base=aq*RECHARGE_WEIGHTS.aquifer+
    so*RECHARGE_WEIGHTS.soil+
    sl*RECHARGE_WEIGHTS.slope+
    fa*RECHARGE_WEIGHTS.flow+
    RECHARGE_WEIGHTS.climate*0.5;
  return clamp01(base*(0.82+need*0.33));
}

export function swaleCellEligible({
  slopePct,
  insideBoundary=true,
  pond=false,
  roadOrDriveway=false,
  structureOrImpervious=false,
  water=false,
  majorChannel=false,
  manualNoBuild=false,
  canopyScore=0,
  canopyKnown=true
}){
  if(!insideBoundary) return false;
  if(!Number.isFinite(Number(slopePct)) || Number(slopePct)>SWALE.maxSlopePct) return false;
  if(pond||roadOrDriveway||structureOrImpervious||water||majorChannel||manualNoBuild) return false;
  if(canopyKnown && Number(canopyScore)>SWALE.forestCanopyGate) return false;
  return true;
}

export function assertRunBundle(bundle){
  if(!bundle||typeof bundle!=='object') throw new Error('missing run bundle');
  for(const k of ['runId','target','extent','dem','hydrology','exclusions','waterPaths','swales','recharge','aquifer','coverage']){
    if(bundle[k]===undefined||bundle[k]===null) throw new Error('run bundle missing '+k);
  }
  if(bundle.swales.some(s=>Number(s.maxSlopePct)>SWALE.maxSlopePct)) throw new Error('swale exceeds 4% rule');
  return true;
}
