import test from 'node:test';
import assert from 'node:assert/strict';
import {createMapPublicationAdapter} from '../core/map-publication.mjs';

const kinds=['waterPaths','contours','rechargeTargets','aquiferPolygons','swales','aquiferLabels'];
const styles=Object.fromEntries(kinds.map(kind=>[kind,{
  type:['aquiferPolygons','rechargeTargets'].includes(kind)?'fill':
    kind==='aquiferLabels'?'symbol':'line',
  paint:{},layout:{visibility:'visible'}}]));
function map(){
  const sources=new Map(),layers=new Map(),order=[];
  const output={sources,layers,order,styleLoaded:true,events:[],
    getSource:k=>sources.get(k),getLayer:k=>layers.get(k),
    isStyleLoaded:()=>output.styleLoaded,
    addSource(k,v){
      const s={data:structuredClone(v.data),setData(next){s.data=structuredClone(next);output.events.push('data:'+k)}};
      sources.set(k,s);
    },
    addLayer(v){layers.set(v.id,v);order.push(v.id);output.events.push('layer:'+v.id)},
    moveLayer(k){const at=order.indexOf(k);if(at>=0)order.splice(at,1);order.push(k);output.events.push('top:'+k)},
    resetStyle(){sources.clear();layers.clear();order.length=0;}
  };
  return output;
}
function fc(geometry,properties={}){
  return {type:'FeatureCollection',features:[{type:'Feature',properties,geometry}]};
}
function snap(run='r1',tier='property',status='verified',hasAquifer=true){
  return {id:run,tier,status,publication:{
    runId:run,tier,
    swales:[{id:run+'-s1',coordinates:[[10,10],[10.1,10.1]]}],
    groundwater:hasAquifer?{status:'verified',source:{dataset:'source-a'}}:
      {status:'unavailable',evidence:[]},
    mapEvidence:{
      waterPaths:fc({type:'LineString',coordinates:[[10,9],[10,11]]}),
      aquiferPolygons:fc({type:'Polygon',coordinates:[[[9,9],[11,9],[11,11],[9,9]]]}),
      aquiferLabels:fc({type:'Point',coordinates:[10,10]},{text:'verified evidence'})
    }
  }};
}
const data=(m,kind)=>m.getSource('earthline116-'+kind).data.features;
test('first Property publication shows exact swales, source water, topmost aquifer label',()=>{
  const m=map(),a=createMapPublicationAdapter(m,styles),s=snap();
  assert.equal(a.sync(s).applied,true);
  assert.deepEqual(data(m,'swales')[0].geometry.coordinates,[[10,10],[10.1,10.1]]);
  assert.equal(data(m,'waterPaths').length,1);
  assert.equal(data(m,'aquiferPolygons').length,1);
  assert.equal(m.order.at(-1),'earthline116-aquiferLabels');
  assert.equal(s.publication.swales[0].coordinates.length,2,'map never mutates science');
});
test('idempotent redraw does not reorder labels or reset source data',()=>{
  const m=map(),a=createMapPublicationAdapter(m,styles),s=snap();
  a.sync(s);const before=m.events.length;
  assert.deepEqual(a.sync(s),{applied:false,status:'already-current'});
  assert.equal(m.events.length,before);
});
test('Regional without groundwater clears old Property polygons and labels',()=>{
  const m=map(),a=createMapPublicationAdapter(m,styles);
  a.sync(snap('r1','property','verified',true));
  const r=a.sync(snap('r2','regional','verified',false));
  assert.equal(r.status,'verified');
  assert.equal(data(m,'aquiferPolygons').length,0);
  assert.equal(data(m,'aquiferLabels').length,0);
  assert.equal(data(m,'swales')[0].properties.runId,'r2');
});
test('analysis in progress clears previous swales, water and aquifers',()=>{
  const m=map(),a=createMapPublicationAdapter(m,styles);
  a.sync(snap('r1'));
  assert.equal(a.sync({id:'r2',tier:'regional',status:'running',publication:null}).status,'cleared');
  for(const kind of kinds)assert.equal(data(m,kind).length,0,kind);
});
test('verified-empty leaves all swales empty',()=>{
  const m=map(),a=createMapPublicationAdapter(m,styles);
  a.sync(snap('r1'));
  const empty=snap('r2','property','verified-empty',false);
  empty.publication.swales=[];
  assert.equal(a.sync(empty).status,'verified-empty');
  assert.equal(data(m,'swales').length,0);
});
test('snapshot mismatch fails closed without leaking prior layer data',()=>{
  const m=map(),a=createMapPublicationAdapter(m,styles);
  a.sync(snap('r1'));
  const bad=snap('r2');bad.publication.runId='r1';
  assert.equal(a.sync(bad).status,'blocked');
  for(const kind of kinds)assert.equal(data(m,kind).length,0,kind);
});
test('a style reload restores the current verified sources and label order',()=>{
  const m=map(),a=createMapPublicationAdapter(m,styles),s=snap();
  a.sync(s);m.resetStyle();
  assert.equal(a.sync(s).status,'verified');
  assert.equal(data(m,'swales').length,1);
  assert.equal(m.order.at(-1),'earthline116-aquiferLabels');
});
test('when Mapbox is not style-ready no science is claimed to render',()=>{
  const m=map(),a=createMapPublicationAdapter(m,styles),s=snap();
  m.styleLoaded=false;
  assert.deepEqual(a.sync(s),{applied:false,status:'style-not-ready'});
  assert.equal(m.sources.size,0);
  m.styleLoaded=true;
  assert.equal(a.sync(s).status,'verified');
});
test('approved layer style contracts are mandatory',()=>{
  const m=map();
  assert.throws(()=>createMapPublicationAdapter(m,{}),/Approved style contract missing/);
});
