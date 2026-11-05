import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('earthline-elder-restored-17097.js','utf8');
const html=readFileSync('index.html','utf8');
new vm.Script(source,{filename:'earthline-elder-restored-17097.js'});
assert.ok(html.includes('<script src="earthline-elder-restored-17097.js" defer></script>'),'approved Elder component must be loaded by production HTML');
const mapReportSource=html.slice(html.indexOf('function mapSvg(d,small=false)'),html.indexOf('function gradeSummary()'));
assert.ok(mapReportSource.includes('dpath=path(r.f)'),'report graphics must use vetted swale vertices, not regenerate curved paths');
assert.ok(mapReportSource.includes('showVermontReference'),'regional report should suppress false Vermont references elsewhere');
assert.ok(mapReportSource.includes('(showVermontReference?towns:[])'),'Vermont-only labels may not appear for other locations');
assert.ok(html.includes("\${window.EARTHLINE_ELDER_TREES_V1_17097?.reportHtml?.(data.d)||''}"),'one frozen report HTML must include current-run Elder evidence in print, tab and download');

const feature={type:'Feature',geometry:{type:'Point',coordinates:[-111.93066,34.21568]},properties:{record_class:'ELDER_TREE_CANDIDATE',source_name:'official test evidence'}};
const empty={type:'FeatureCollection',features:[]};
let src=null,layer=null,sourceWrites=0,layoutWrites=0,reorderWrites=0,paintWrites=0,workerConstruction=0;
const map={
  getStyle:()=>({layers:layer?[layer]:[]}),
  getSource:()=>src,
  addSource(_id,cfg){src={_data:cfg.data,setData(fc){sourceWrites++;this._data=fc}};},
  getLayer:()=>layer,
  addLayer(l){layer=l;},
  getLayoutProperty:()=> 'visible',
  setLayoutProperty(){layoutWrites++;},
  moveLayer(){reorderWrites++;},
  triggerRepaint(){paintWrites++;},
  hasImage:()=>true,addImage(){},on(){},once(){},
  getBounds(){return {getWest:()=>-112.2,getSouth:()=>34.0,getEast:()=>-111.7,getNorth:()=>34.4}}
};
const root={dataset:{earthlineAnalysisTier:'regional'}};
const document={
  readyState:'complete',documentElement:root,addEventListener(){},
  getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],
  createElement:()=>({getContext:()=>null})
};
const window={earthlineMap:map,EARTHLINE_DISPLAYED_RUN_16151:{runToken:'current-regional',tier:'regional'},addEventListener(){},EARTHLINE_PROPERTY_TARGET_16201:null};
class FakeWorker{
  constructor(){workerConstruction++;}
  postMessage(message){queueMicrotask(()=>this.onmessage?.({data:message.warm?{id:message.id,ok:true,warm:true}:{id:message.id,ok:true,result:{type:'FeatureCollection',features:[feature],earthline:{candidate_pool_count:3}}}}));}
  terminate(){}
}
async function fetch(url){
  if(url==='data/elder-trees/v2/manifest.json')return {ok:true,json:async()=>({datasets:[{id:'test-elder',label:'Test',path:'data/elder-trees/v2/test.geojson',bbox:[-112.2,34,-111.7,34.4],coverage_complete:false}]})};
  if(url==='data/elder-trees/v2/test.geojson')return {ok:true,json:async()=>({type:'FeatureCollection',features:[feature]})};
  throw Error('Unexpected '+url);
}
const ctx={window,document,location:{hash:''},fetch,Worker:FakeWorker,setTimeout,clearTimeout,queueMicrotask,console,URL};
vm.runInNewContext(source,ctx,{timeout:3000});
const api=window.EARTHLINE_ELDER_TREES_V1_17097;
assert.ok(api&&typeof api.reportHtml==='function','approved Elder API must expose frozen report HTML');
assert.equal(workerConstruction,0,'optional CHM worker must not start on map load');
await api.refresh();
const writes=sourceWrites;
await api.refresh();
assert.equal(sourceWrites,writes,'identical Elder map data must not be reprocessed on rerun');
assert.equal(layoutWrites,0,'visible Elder layer must not be rewritten');
assert.equal(reorderWrites,0,'Elder must not compete for Mapbox layer order');
assert.equal(paintWrites,0,'unchanged Elder points must not trigger repaint');
const live=api.reportHtml({runToken:'current-regional',tier:'regional'});
assert.ok(live.includes('candidate display points'),'verified current-run Elder counts should appear in frozen report HTML');
const stale=api.reportHtml({runToken:'different-regional',tier:'regional'});
assert.ok(!stale.includes('1 candidate display points'),'prior run must not leak into later report');
assert.ok(stale.includes('not yet published'),'unavailable same-run evidence must be explicit, not invented');
root.dataset.earthlineAnalysisTier='property';
window.EARTHLINE_PROPERTY_TARGET_16201={lng:-111.93066,lat:34.21568};
window.EARTHLINE_DISPLAYED_RUN_16151={runToken:'property-A',tier:'property'};
await api.startProperty();
const property=api.reportHtml({runToken:'property-A',tier:'property'});
assert.ok(property.includes('candidate display points'),'current Property should export committed Elder evidence');
window.EARTHLINE_PROPERTY_TARGET_16201={lng:-111.85,lat:34.22};
assert.ok(api.reportHtml({runToken:'property-A',tier:'property'}).includes('not yet published'),'different Property cannot inherit stale count even with same token');
console.log('MANTRA114_ELDER_REPORT_PASS: component linked, lazy worker, stable source, frozen report export and same-run evidence guards');
