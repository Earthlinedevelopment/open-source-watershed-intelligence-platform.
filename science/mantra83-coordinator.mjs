// Mantra 83 forensic run coordinator — NON-PRODUCTION.
// Single owner for run identity, cancellation, science execution, publication and renderer handoff.

import {buildScienceBundle} from './mantra83-engine.mjs';
import {publishableSnapshot} from './mantra83-publication.mjs';
import {toRendererModel} from './mantra83-renderer-adapter.mjs';

export const COORDINATOR_VERSION='m83-coordinator-1';

export class RunCoordinator{
  #seq=0;
  #active=null;
  #published=null;

  get activeRunId(){return this.#active?.runId||null;}
  get publishedRunId(){return this.#published?.runId||null;}
  get published(){return this.#published;}

  cancelActive(reason='superseded'){
    if(this.#active)this.#active.cancelled=true;
    return {cancelledRunId:this.#active?.runId||null,reason};
  }

  async run(input){
    this.cancelActive('new-run');
    const runId=String(input.runId||('m83-'+(++this.#seq)));
    const token={runId,cancelled:false};
    this.#active=token;

    const science=buildScienceBundle({...input,runId});
    if(token.cancelled||this.#active!==token)return {status:'cancelled',runId};

    const publication=publishableSnapshot(science);
    if(token.cancelled||this.#active!==token)return {status:'cancelled',runId};

    const renderer=toRendererModel(science);
    if(token.cancelled||this.#active!==token)return {status:'cancelled',runId};

    const result=Object.freeze({status:'published',runId,science,publication,renderer});
    this.#published=result;
    return result;
  }
}
