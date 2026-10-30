// Mantra 83 shadow comparator — NON-PRODUCTION.
// Compares legacy page outputs with unified engine outputs without publishing the unified result.

export const SHADOW_VERSION='m83-shadow-1';

function arr(v){return Array.isArray(v)?v:[];}
function num(v,d=0){v=Number(v);return Number.isFinite(v)?v:d;}

export function compareRuns({legacy,newRun}){
  if(!legacy||!newRun)throw new Error('legacy and newRun required');

  const legacySwales=arr(legacy.swales);
  const newSwales=arr(newRun.science?.swales||newRun.publication?.swales);
  const legacyTarget=legacy.target||legacy.location||{};
  const newTarget=newRun.science?.target||newRun.publication?.target||{};

  const targetDeltaM=(()=>{
    const lat1=num(legacyTarget.lat),lon1=num(legacyTarget.lng??legacyTarget.lon);
    const lat2=num(newTarget.lat),lon2=num(newTarget.lng??newTarget.lon);
    const R=6371000, p1=lat1*Math.PI/180,p2=lat2*Math.PI/180;
    const dp=(lat2-lat1)*Math.PI/180,dl=(lon2-lon1)*Math.PI/180;
    const a=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
    return 2*R*Math.asin(Math.min(1,Math.sqrt(a)));
  })();

  const legacyMaxSlope=Math.max(0,...legacySwales.map(s=>num(s.maxSlopePct??s.maxSlope??s.slopePct,0)));
  const newMaxSlope=Math.max(0,...newSwales.map(s=>num(s.maxSlopePct,0)));

  return Object.freeze({
    shadowVersion:SHADOW_VERSION,
    legacyRunId:String(legacy.runId??legacy.token??'unknown'),
    newRunId:String(newRun.runId??newRun.science?.runId??'unknown'),
    targetDeltaM:Number(targetDeltaM.toFixed(3)),
    swaleCountLegacy:legacySwales.length,
    swaleCountNew:newSwales.length,
    swaleCountDelta:newSwales.length-legacySwales.length,
    legacyMaxSlopePct:legacyMaxSlope,
    newMaxSlopePct:newMaxSlope,
    legacyViolatesFourPct:legacyMaxSlope>4,
    newViolatesFourPct:newMaxSlope>4,
    samePublicationIdentity:String(legacy.runId??legacy.token??'')===String(newRun.runId??newRun.science?.runId??'')
  });
}
