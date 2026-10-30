// Mantra 83 legacy-to-shadow input adapter — NON-PRODUCTION.
// Converts only explicitly available legacy scientific state. Missing required state fails closed.

export const LEGACY_ADAPTER_VERSION='m83-legacy-adapter-1';

function finite(v){v=Number(v);return Number.isFinite(v)?v:null;}

export function legacyToScienceInput({displayed,model,gw,gh,cellM}){
  if(!displayed||!displayed.runToken)throw new Error('legacy displayed run identity missing');
  if(!model)throw new Error('legacy scientific model missing');
  const width=Number(gw||model.GW||0),height=Number(gh||model.GH||0);
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<3||height<3)throw new Error('legacy grid dimensions missing');
  if(!model.h||Number(model.h.length)!==width*height)throw new Error('legacy DEM missing or dimension mismatch');

  const targetSource=
    displayed.target||
    displayed.location||
    model.loc||
    null;
  const lat=finite(targetSource&&targetSource.lat);
  const lng=finite(targetSource&&(targetSource.lng??targetSource.lon));
  if(lat===null||lng===null)throw new Error('legacy target identity missing');

  const bounds=
    Array.isArray(displayed.bounds)&&displayed.bounds.length===4?displayed.bounds:
    Array.isArray(displayed.extent)&&displayed.extent.length===4?displayed.extent:
    Array.isArray(model.bounds)&&model.bounds.length===4?model.bounds:
    null;
  if(!bounds)throw new Error('legacy analysis extent missing');

  const swaleCandidates=(Array.isArray(model.swales)?model.swales:[]).map((s,i)=>({
    id:String(s.id??('legacy-'+i)),
    metersPerGrid:Number(model.cellM||cellM||1),
    anchor:s.anchor||null,
    coordinates:s.coordinates||null,
    samples:Array.isArray(s.samples)?s.samples:[]
  }));

  return {
    runId:String(displayed.runToken),
    mode:String(displayed.tier||displayed.mode||'unknown').toLowerCase(),
    target:{lat,lng},
    extent:bounds.map(Number),
    dem:{
      source:String(model.demSource||model.source||'legacy-current-run'),
      resolutionM:Number(model.cellM||cellM||1),
      width,height,
      elevation:Float64Array.from(model.h,Number)
    },
    validMask:model.inP?Uint8Array.from(model.inP,v=>v?1:0):null,
    cellXM:Number(model.cellM||cellM||1),
    cellYM:Number(model.cellM||cellM||1),
    swaleCandidates,
    exclusions:{status:model.noBuildMask?'available':'unavailable'},
    waterPaths:[],
    contours:[],
    aquiferEvidence:{status:'legacy-observer-only'},
    elderEvidence:{status:'legacy-observer-only',rechargeWeight:0},
    coverage:{status:'shadow-observer'}
  };
}
