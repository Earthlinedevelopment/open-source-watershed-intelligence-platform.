import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Simulates a Regional refresh still waiting for the manifest while Property begins,
// then checks that the old Regional result cannot clear current Property Elder points.
const callbacks=[];
let ready=true;
let featureCollection=null;
let layer=null;
const source={setData(fc){featureCollection=fc}};
const map={
  getStyle(){return ready?{layers:[]}:null},
  getSource(){return featureCollection?source:null},
  addSource(_id,config){featureCollection=config.data},
  getLayer(){return layer},
  addLayer(config){layer=config},
  hasImage(){return true},addImage(){},
  setLayoutProperty(){},moveLayer(){},triggerRepaint(){},on(){},
  once(event,callback){if(event==='style.load')callbacks.push(callback)}
};
const document={
  readyState:'complete',
  documentElement:{dataset:{earthlineAnalysisTier:'regional'}},
  addEventListener(){},
  getElementById(){return null},
  querySelector(){return null},querySelectorAll(){return []},
  createElement(){return {getContext(){return null}}}
};
const window={
  earthlineMap:map,
  addEventListener(){},
  EARTHLINE_PROPERTY_TARGET_16201:null
};
let releaseManifest;
const manifest=new Promise(resolve=>{releaseManifest=resolve});
async function fetch(url){
  if(url==='data/elder-trees/v2/manifest.json')return {ok:true,json:()=>manifest};
  throw Error('Unexpected dataset '+url);
}
class FakeWorker {
  postMessage(message){
    queueMicrotask(()=>{
      const center=message.bbox
        ? [(message.bbox[0]+message.bbox[2])/2,(message.bbox[1]+message.bbox[3])/2]
        : [-111.93,34.21];
      const result={
        type:'FeatureCollection',
        features:[{type:'Feature',geometry:{type:'Point',coordinates:center},
          properties:{record_class:'ELDER_TREE_CANDIDATE',source_name:'test evidence'}}],
        earthline:{candidate_pool_count:1}
      };
      this.onmessage?.({data:message.warm
        ? {id:message.id,ok:true,warm:true}
        : {id:message.id,ok:true,result}});
    });
  }
  terminate(){}
}
const ctx={window,document,location:{hash:''},fetch,Worker:FakeWorker,
  setTimeout,clearTimeout,queueMicrotask,console,URL};
vm.runInNewContext(readFileSync('earthline-elder-restored-17097.js','utf8'),ctx);
const api=window.EARTHLINE_ELDER_TREES_V1_17097;
assert.ok(api,'Elder owner is installed');

const staleRegional=api.refresh();
document.documentElement.dataset.earthlineAnalysisTier='property';
window.EARTHLINE_PROPERTY_TARGET_16201={lng:-111.93066,lat:34.21568};
const freshProperty=api.startProperty();
releaseManifest({datasets:[]});
await Promise.all([staleRegional,freshProperty]);
let status=window.EARTHLINE_ELDER_TREE_LAST_17097;
assert.equal(status.state,'committed','Property must remain authoritative');
assert.equal(status.mapPublished,true,'Property must actually publish to map');
assert.equal(status.featureCount,1,'Worker evidence survives prior Regional refresh');
assert.ok(status.propertyRunIdentity.startsWith('-111.930660|34.215680|'));
assert.equal(featureCollection?.features?.length,1,'One point must reach Mapbox source');

// A failed map publication must not be falsely labeled committed, and the
// single registered Mapbox style.load retry must recover without a poll loop.
ready=false;
await api.startProperty();
status=window.EARTHLINE_ELDER_TREE_LAST_17097;
assert.equal(status.state,'publication-pending');
assert.equal(status.mapPublished,false);
assert.equal(callbacks.length,1,'At most one style-load retry for pending run');
ready=true;
callbacks.shift()();
await new Promise(resolve=>setTimeout(resolve,20));
status=window.EARTHLINE_ELDER_TREE_LAST_17097;
assert.equal(status.state,'committed','Map retry should publish when style loads');
assert.equal(status.mapPublished,true);
console.log('MANTRA94_ELDER_OWNER_PASS',JSON.stringify({identity:status.propertyRunIdentity,count:status.featureCount}));
