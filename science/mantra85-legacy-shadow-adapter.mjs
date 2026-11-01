// Earthline Mantra 85 — read-only legacy acquisition adapter for shadow comparison.
// It NEVER publishes and NEVER consumes legacy swale geometry.
// Unproven science inputs remain pending; the publication gate blocks them rather than guessing.

import {stableHash,deepFreeze,normalizeTarget,normalizeExtent} from './mantra85-contract.mjs';

export const LEGACY_SHADOW_ADAPTER_VERSION='m85-legacy-shadow-adapter-2';

function finite(v){ v=Number(v); return Number.isFinite(v)?v:null; }
function copyNumeric(a,Type=Float64Array){
  if(!a || typeof a.length!=='number') return null;
  const out=new Type(a.length);
  for(let i=0;i<a.length;i++) out[i]=Number(a[i]);
  return out;
}
function copyMask(a){
  if(!a || typeof a.length!=='number') return null;
  const out=new Uint8Array(a.length);
  for(let i=0;i<a.length;i++) out[i]=a[i]?1:0;
  return out;
}
function digestArray(a){
  if(!a) return 'none';
  let h=0xcbf29ce484222325n,p=0x100000001b3n,mask=0xffffffffffffffffn;
  for(let i=0;i<a.length;i++){
    const v=Number(a[i]),s=Number.isFinite(v)?String(Object.is(v,-0)?0:v):'NaN';
    for(let j=0;j<s.length;j++){h^=BigInt(s.charCodeAt(j));h=(h*p)&mask;}
    h^=124n;h=(h*p)&mask;
  }
  return h.toString(16).padStart(16,'0');
}
function bboxFromPolygon(poly){
  if(!Array.isArray(poly)||poly.length<3) return null;
  let w=Infinity,s=Infinity,e=-Infinity,n=-Infinity;
  for(const p of poly){
    if(!Array.isArray(p)||p.length<2) continue;
    const x=finite(p[0]),y=finite(p[1]); if(x===null||y===null) continue;
    w=Math.min(w,x);e=Math.max(e,x);s=Math.min(s,y);n=Math.max(n,y);
  }
  return [w,s,e,n].every(Number.isFinite)?[w,s,e,n]:null;
}
function propertyElderEvidence(elderLast,expectedIdentity){
  if(!elderLast) return {status:'pending',rechargeWeight:0,reason:'Elder state missing'};
  const state=String(elderLast.state||'').toLowerCase(),identity=String(elderLast.propertyRunIdentity||'');
  if(state==='committed' && identity && identity===String(expectedIdentity||'')){
    return {status:'ready',rechargeWeight:0,propertyRunIdentity:identity,featureCount:Number(elderLast.featureCount||0),summary:elderLast.summary||null};
  }
  if(state==='failed') return {status:'failed',rechargeWeight:0,error:String(elderLast.error||'Elder computation failed')};
  return {status:'pending',rechargeWeight:0,propertyRunIdentity:identity||null,reason:'Elder evidence not committed to current Property identity'};
}
function evidenceWithInput(input,evidence,label){
  if(!input) return deepFreeze({status:'pending',reason:label+' input missing'});
  if(!evidence||typeof evidence!=='object') return deepFreeze({status:'pending',reason:label+' provenance missing'});
  return deepFreeze({...evidence,status:String(evidence.status||'pending')});
}

export function legacyAcquisitionToM85({
  mode,displayed,model,gridWidth,gridHeight,target=null,extent=null,
  propertyDeclaration=null,propertyElderIdentity=null,elderLast=null,
  aquiferEvidence=null,coverage=null,sourcePlanVersion='legacy-shadow',
  rechargeGrid=null,rechargeEvidence=null,forestNoBuildMask=null,forestEvidence=null,
  cellXM=null,cellYM=null
}){
  mode=String(mode||displayed?.tier||displayed?.mode||'').toLowerCase();
  if(mode!=='property'&&mode!=='regional') throw new Error('legacy mode not proven');
  if(!displayed?.runToken) throw new Error('legacy displayed runToken missing');
  if(!model) throw new Error('legacy scientific model missing');

  const explicitTarget=target || (mode==='property' ? null : (displayed.target||displayed.location||null));
  const t=normalizeTarget(explicitTarget||(mode==='property'?target:null)||model.loc||null);

  const declarationCenter=propertyDeclaration?.center||null;
  if(mode==='property'&&declarationCenter){
    const d=normalizeTarget(declarationCenter);
    if(stableHash(d)!==stableHash(t)) throw new Error('Property target/declaration identity mismatch');
  }

  const derivedExtent=extent || (mode==='property' ? bboxFromPolygon(model.analysisBoundaryLngLat) : (displayed.bounds||displayed.extent||null));
  const e=normalizeExtent(derivedExtent);
  if(t.lng<e[0]||t.lng>e[2]||t.lat<e[1]||t.lat>e[3]) throw new Error('legacy target outside proven analysis extent');

  const width=Number(gridWidth),height=Number(gridHeight);
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<3||height<3) throw new Error('legacy grid dimensions not explicit');
  const N=width*height;
  const elevation=copyNumeric(model.h,Float64Array);
  if(!elevation||elevation.length!==N) throw new Error('legacy DEM missing or dimension mismatch');
  const validMask=copyMask(model.inP);
  if(!validMask||validMask.length!==N) throw new Error('legacy validity mask missing or dimension mismatch');

  const combinedNoBuild=copyMask(model.noBuildMask);
  if(!combinedNoBuild||combinedNoBuild.length!==N) throw new Error('legacy final no-build mask missing or dimension mismatch');
  const recharge=copyNumeric(rechargeGrid,Float64Array);
  if(recharge&&recharge.length!==N) throw new Error('legacy recharge grid dimension mismatch');
  const forest=copyMask(forestNoBuildMask);
  if(forest&&forest.length!==N) throw new Error('legacy forest exclusion mask dimension mismatch');

  const cx=finite(cellXM??model.cellM),cy=finite(cellYM??model.cellM);
  if(cx===null||cy===null||cx<=0||cy<=0) throw new Error('legacy cell dimensions not explicit');

  const elder=mode==='property'
    ? propertyElderEvidence(elderLast,propertyElderIdentity)
    : {status:'unavailable',rechargeWeight:0,reason:'Regional Elder not required by Mantra 85 shadow'};
  const aq=aquiferEvidence||{status:'unavailable',reason:'Aquifer evidence not supplied to shadow adapter'};
  const cov=deepFreeze(coverage||{status:'unknown'});
  const exclusionEvidence=deepFreeze({status:'ready',source:'legacy-final-no-build-mask',combinedFinalVeto:true});
  const reEvidence=evidenceWithInput(recharge,rechargeEvidence,'Recharge');
  const fEvidence=evidenceWithInput(forest,forestEvidence,'Forest exclusion');

  const acquisitionFingerprint=stableHash({
    adapterVersion:LEGACY_SHADOW_ADAPTER_VERSION,
    runToken:String(displayed.runToken),mode,target:t,extent:e,width,height,cellXM:cx,cellYM:cy,
    dem:digestArray(elevation),validMask:digestArray(validMask),combinedNoBuild:digestArray(combinedNoBuild),
    recharge:digestArray(recharge),forest:digestArray(forest),
    elderState:elder.status,elderIdentity:elder.propertyRunIdentity||null,aquiferStatus:String(aq.status||''),
    rechargeStatus:String(reEvidence.status||''),forestStatus:String(fEvidence.status||'')
  });

  return deepFreeze({
    sourcePlanVersion:String(sourcePlanVersion),legacyRunToken:String(displayed.runToken),acquisitionFingerprint,
    target:t,extent:e,
    dem:{source:String(model.demSource||model.source||'legacy-current-run'),resolutionM:Math.max(cx,cy),width,height,elevation},
    validMask,cellXM:cx,cellYM:cy,
    manualNoBuildMask:combinedNoBuild,
    rechargeGrid:recharge,rechargeEvidence:reEvidence,
    forestNoBuildMask:forest,forestEvidence:fEvidence,
    waterPaths:[],aquiferEvidence:deepFreeze(aq),elderEvidence:deepFreeze(elder),coverage:cov,exclusionEvidence,
    provenance:deepFreeze({
      adapterVersion:LEGACY_SHADOW_ADAPTER_VERSION,displayedRunToken:String(displayed.runToken),
      dem:'M.h',validMask:'M.inP',combinedNoBuild:'M.noBuildMask',
      recharge:recharge?'explicit caller-proven grid':'unproven',
      forest:forest?'explicit caller-proven exclusion mask':'unproven',
      extent:mode==='property'?'M.analysisBoundaryLngLat bbox':'displayed.bounds/displayed.extent',
      elder:mode==='property'?'EARTHLINE_ELDER_TREE_LAST_17097 committed matching Property identity':'not required'
    })
  });
}
