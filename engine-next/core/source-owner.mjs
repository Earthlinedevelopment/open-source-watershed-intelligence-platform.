/**
 * Earthline vNext — pure, dependency-free run ownership primitive.
 * No DOM, Mapbox, network, side effects, or production wiring.
 *
 * Separates authoritative per-run source publication from visual rendering.
 * "Carryover" is explicitly provisional and NEVER a current evidence claim.
 */
export class SourceOwner {
  #generation=0;
  #active=null;
  #lastAccepted=null;
  #audit=[];
  constructor(sourceName) {
    if(typeof sourceName!=='string'||!sourceName.trim())throw new TypeError('sourceName required');
    this.sourceName=sourceName;
  }
  begin({extentKey,runId}) {
    if(typeof extentKey!=='string'||!extentKey.trim())throw new TypeError('extentKey required');
    if(typeof runId!=='string'||!runId.trim())throw new TypeError('runId required');
    const token=Object.freeze({generation:++this.#generation,runId,extentKey});
    this.#active=token;
    this.#audit.push({event:'begin',generation:token.generation,runId,extentKey});
    return token;
  }
  isCurrent(token) {
    return !!(token && this.#active &&
      token.generation===this.#active.generation &&
      token.runId===this.#active.runId && token.extentKey===this.#active.extentKey);
  }
  accept(token, featureCollection, provenance) {
    if(!this.isCurrent(token))return this.#reject('stale-run',token);
    if(!featureCollection||featureCollection.type!=='FeatureCollection'||
       !Array.isArray(featureCollection.features)||!featureCollection.features.length)
      return this.#reject('empty-or-invalid-evidence',token);
    if(typeof provenance!=='string'||!provenance.trim())
      return this.#reject('missing-provenance',token);
    // Defensive snapshot: neither caller mutation nor downstream renderer may modify evidence.
    const data=JSON.parse(JSON.stringify(featureCollection));
    if(data.features.some(f=>!f||f.type!=='Feature'||!f.geometry||!f.geometry.type))
      return this.#reject('invalid-feature',token);
    this.#lastAccepted={extentKey:token.extentKey,runId:token.runId,
      generation:token.generation,provenance,data};
    this.#audit.push({event:'accepted',runId:token.runId,generation:token.generation,
      featureCount:data.features.length,provenance});
    return {ok:true,status:'current',runId:token.runId,extentKey:token.extentKey,
      provenance,data:JSON.parse(JSON.stringify(data))};
  }
  provisional(token,reason) {
    if(!this.isCurrent(token))return this.#reject('stale-run',token);
    const old=this.#lastAccepted;
    if(!old||old.extentKey!==token.extentKey)
      return this.#reject('no-same-extent-evidence',token);
    if(typeof reason!=='string'||!reason.trim())
      return this.#reject('missing-carryover-reason',token);
    this.#audit.push({event:'provisional',runId:token.runId,fromRunId:old.runId,
      reason,extentKey:token.extentKey});
    return {ok:true,status:'provisional-carryover',runId:token.runId,
      fromRunId:old.runId,extentKey:token.extentKey,reason,
      provenance:old.provenance,data:JSON.parse(JSON.stringify(old.data))};
  }
  #reject(reason,token) {
    this.#audit.push({event:'rejected',reason,runId:token?.runId??null});
    return {ok:false,reason};
  }
  get audit(){return this.#audit.map(x=>({...x}));}
}
