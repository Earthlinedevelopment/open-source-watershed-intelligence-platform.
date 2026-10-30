import assert from 'node:assert/strict';
import {legacyToScienceInput} from '../science/mantra83-legacy-adapter.mjs';

const w=6,h=5;
const model={
  h:new Float64Array(w*h).fill(100),
  inP:new Uint8Array(w*h).fill(1),
  cellM:5,
  loc:{lat:44,lng:-72},
  bounds:[-72.1,43.9,-71.9,44.1],
  swales:[]
};
const displayed={runToken:'legacy-1',tier:'property',target:{lat:44,lng:-72},bounds:[-72.1,43.9,-71.9,44.1]};
const x=legacyToScienceInput({displayed,model,gw:w,gh:h});
assert.equal(x.runId,'legacy-1');
assert.equal(x.dem.elevation.length,w*h);
assert.equal(x.target.lat,44);
assert.equal(x.mode,'property');

for(const bad of [
  ()=>legacyToScienceInput({displayed:null,model,gw:w,gh:h}),
  ()=>legacyToScienceInput({displayed,model:null,gw:w,gh:h}),
  ()=>legacyToScienceInput({displayed,model:{...model,h:new Float64Array(2)},gw:w,gh:h}),
  ()=>legacyToScienceInput({displayed:{runToken:'x',tier:'property'},model:{...model,loc:null,bounds:null},gw:w,gh:h})
]){
  let threw=false;try{bad();}catch{threw=true;}assert.equal(threw,true);
}
console.log('MANTRA83_LEGACY_ADAPTER_PASS');
