// Mantra 83 forensic unified science engine — NON-PRODUCTION.
// One pure run bundle for both Property and Regional.

import {hydrology} from './mantra83-hydrology.mjs';
import {rechargeSuitability,assertRunBundle,SWALE} from './mantra83-core.mjs';
import {selectSwales} from './mantra83-swales.mjs';

export const ENGINE_VERSION='m83-unified-engine-1';

function freezeDeep(v){
  if(!v||typeof v!=='object'||Object.isFrozen(v))return v;
  for(const k of Object.keys(v))freezeDeep(v[k]);
  return Object.freeze(v);
}

export function buildScienceBundle(input){
  if(!input||!input.runId)throw new Error('runId required');
  if(!input.target||!Number.isFinite(Number(input.target.lat))||!Number.isFinite(Number(input.target.lng)))throw new Error('target required');
  if(!Array.isArray(input.extent)||input.extent.length!==4)throw new Error('extent required');
  const {width,height,elevation}=input.dem||{};
  if(!Number.isInteger(width)||!Number.isInteger(height)||!elevation)throw new Error('DEM required');

  const hydro=hydrology(elevation,width,height,{
    validMask:input.validMask||null,
    cellXM:Number(input.cellXM||1),
    cellYM:Number(input.cellYM||1)
  });

  const rechargeGrid=new Float64Array(width*height);
  for(let i=0;i<rechargeGrid.length;i++){
    const slope=hydro.slopePct[i];
    if(!Number.isFinite(slope)){rechargeGrid[i]=NaN;continue;}
    const flowNorm=Math.min(1,Math.log1p(Math.max(0,hydro.accumulation[i]))/Math.log1p(Math.max(2,width*height)));
    rechargeGrid[i]=rechargeSuitability({
      aquifer:Number(input.aquiferGrid?.[i]??input.aquiferFallback??0),
      soil:Number(input.soilGrid?.[i]??input.soilFallback??0),
      slopePct:slope,
      flow:flowNorm,
      annualPrecipIn:Number(input.annualPrecipIn??30)
    });
  }

  const candidates=(input.swaleCandidates||[]).map(c=>({
    ...c,
    samples:(c.samples||[]).map(s=>{
      const idx=Number.isInteger(s.i)?s.i:(Math.round(s.y)*width+Math.round(s.x));
      return {
        ...s,
        slopePct:Number.isFinite(Number(s.slopePct))?Number(s.slopePct):Number(hydro.slopePct[idx]),
        flowScore:Number.isFinite(Number(s.flowScore))?Number(s.flowScore):Math.min(1,Math.log1p(Math.max(0,hydro.accumulation[idx]))/Math.log1p(Math.max(2,width*height))),
        rechargeScore:Number.isFinite(Number(s.rechargeScore))?Number(s.rechargeScore):Number(rechargeGrid[idx]),
        insideBoundary:s.insideBoundary!==false,
        roadOrDriveway:!!s.roadOrDriveway,
        structureOrImpervious:!!s.structureOrImpervious,
        water:!!s.water,
        majorChannel:!!s.majorChannel,
        manualNoBuild:!!s.manualNoBuild,
        canopyKnown:s.canopyKnown!==false,
        canopyScore:Number(s.canopyScore||0)
      };
    })
  }));

  const swales=selectSwales(candidates,{maxCount:Number(input.maxSwales||200)});
  const bundle={
    engineVersion:ENGINE_VERSION,
    runId:String(input.runId),
    mode:String(input.mode||'property'),
    target:{lat:Number(input.target.lat),lng:Number(input.target.lng)},
    extent:input.extent.map(Number),
    dem:{
      source:String(input.dem.source||'unknown'),
      resolutionM:Number(input.dem.resolutionM||Math.max(Number(input.cellXM||1),Number(input.cellYM||1))),
      width,height
    },
    hydrology:{
      version:hydro.version,
      fillEpsilonM:hydro.fillEpsilonM,
      filled:hydro.filled,
      pondDepth:hydro.pondDepth,
      to:hydro.to,
      slopePct:hydro.slopePct,
      accumulation:hydro.accumulation
    },
    exclusions:input.exclusions||{status:'unknown'},
    waterPaths:input.waterPaths||[],
    contours:input.contours||[],
    swales,
    recharge:{
      grid:rechargeGrid,
      weights:{aquifer:.30,soil:.20,slope:.18,flow:.17,climate:.15}
    },
    aquifer:input.aquiferEvidence||{status:'unavailable'},
    elder:input.elderEvidence||{status:'unavailable',rechargeWeight:0},
    coverage:input.coverage||{status:'unknown'},
    rules:{
      maxSwaleSlopePct:SWALE.maxSlopePct,
      targetSpacingM:SWALE.targetSpacingM,
      minSpacingM:SWALE.minSpacingM,
      maxSpacingM:SWALE.maxSpacingM
    }
  };
  assertRunBundle(bundle);
  return freezeDeep(bundle);
}
