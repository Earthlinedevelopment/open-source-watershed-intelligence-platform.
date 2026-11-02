// Earthline Mantra 85 — single run coordinator / state machine.
// Sole owner of ACQUIRE -> COMPUTE -> VALIDATE -> PUBLISH -> COMPLETE or FAILED.

import {createRunRequest,createRunIdentity,deepFreeze} from './mantra85-contract.mjs';
import {buildScienceBundle} from './mantra85-engine.mjs';
import {publishableSnapshot} from './mantra85-publication.mjs';
import {toRendererModel} from './mantra85-renderer-adapter.mjs';
export const COORDINATOR_VERSION='m85-coordinator-1';
const TERMINAL=new Set(['COMPLETE','FAILED','CANCELLED']);

export class RunCoordinator{
  #seq=0;#active=null;#state='IDLE';#published=null;#commit;
  constructor({commit=null}={}){if(commit&&typeof commit!=='function')throw new Error('commit must be function');this.#commit=commit;}
  get state(){return this.#state;} get activeRunId(){return this.#active?.runId||null;} get published(){return this.#published;}
  #setState(token,state){if(this.#active!==token||token.cancelled)throw new Error('stale run attempted state transition');this.#state=state;}
  cancelActive(reason='superseded'){if(this.#active&&!TERMINAL.has(this.#state)){this.#active.cancelled=true;this.#active.cancelReason=reason;this.#state='CANCELLED';}return this.#active?.runId||null;}
  async run(rawRequest,acquire){
    if(typeof acquire!=='function')throw new Error('acquire function required');this.cancelActive('new-run');
    const request=createRunRequest({...rawRequest,runId:String(rawRequest.runId||`m85-${++this.#seq}`)}),token={runId:request.runId,cancelled:false};this.#active=token;
    try{
      this.#setState(token,'ACQUIRE');const acquired=await acquire(request);
      if(token.cancelled||this.#active!==token)return deepFreeze({status:'cancelled',runId:token.runId});
      if(!acquired?.acquisitionFingerprint)throw new Error('acquisition fingerprint required');
      const identity=createRunIdentity(request,acquired.acquisitionFingerprint);
      this.#setState(token,'COMPUTE');const science=buildScienceBundle({request,identity,acquired});
      this.#setState(token,'VALIDATE');const publication=publishableSnapshot(science);const renderer=toRendererModel(science);
      this.#setState(token,'PUBLISH');if(this.#commit)await this.#commit(deepFreeze({identity,publication,renderer}));
      if(token.cancelled||this.#active!==token)return deepFreeze({status:'cancelled',runId:token.runId});
      const result=deepFreeze({status:'published',runId:token.runId,identity,science,publication,renderer});this.#published=result;this.#setState(token,'COMPLETE');return result;
    }catch(err){if(token.cancelled||this.#active!==token)return deepFreeze({status:'cancelled',runId:token.runId});this.#state='FAILED';return deepFreeze({status:'failed',runId:token.runId,error:String(err?.message||err)});}
  }
}
