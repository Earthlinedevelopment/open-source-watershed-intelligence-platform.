// M98 regression: legacy Property water repaint must not seize global renderer ownership.
// Run: node tests/m98-water-renderer-ownership.mjs
import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync('index.html','utf8');
const id='earthline-build-15823-water-path-restoration';
const match=html.match(new RegExp('<script id="'+id+'">([\\s\\S]*?)<\\/script>'));
assert.ok(match,'legacy Property water script must be present');
new vm.Script(match[1],{filename:id+'.js'});
assert.ok(!match[1].includes('window.earthlineApplyRendererOwnership15805("property")'),
  'auxiliary water owner must not set global renderer ownership');
assert.ok(html.includes('function publishPropertyDisplay16220('),
  'authoritative Property publication must remain present');
assert.ok(html.includes('M.authoritativeSafeSwales15815') ||
  html.includes('m.authoritativeSafeSwales15815'),
  'safe swales must remain authoritative');
const events={};
let renders=0, ownershipCalls=0;
const panel={dataset:{},innerHTML:''};
const model={
  analysisReady:true,
  propertyFlowGeneration15823:{method:'D8'},
  propertyFlowRenderer15792:{visible:false,sourceFeatures:1,generatedFeatures:1}
};
const state={mode:'property',active:false};
const windowObj={
  earthlineRegional15778:state,
  earthlineSyncPropertyFlow15792:()=>{renders++;model.propertyFlowRenderer15792.visible=true;return true;},
  earthlineApplyRendererOwnership15805:()=>{ownershipCalls++;}
};
const ctx={
 window:windowObj,M:model,earthlineMap:{on:(event,fn)=>{events[event]=fn;}},
 document:{
   getElementById:(id)=>id==='earthlineWaterPathStatus15823'?panel:null,
   querySelector:()=>null
 },
 setInterval:()=>0,setTimeout:()=>0,clearTimeout:()=>{},
 console:{log:()=>{}},Date,Number,String,Set,Math
};
vm.runInNewContext(match[1],ctx,{timeout:1000});
assert.equal(typeof events.moveend,'function');
assert.equal(typeof events.zoomend,'function');
events.moveend();events.zoomend();
assert.equal(renders,2,'water should continue updating after movement');
assert.equal(ownershipCalls,0,'water must not reassign global Property owner');
assert.equal(model.propertyFlowRenderer15792.visible,true,'water should remain visible');
state.active=true;events.moveend();
assert.equal(renders,2,'water should not redraw when Property is inactive');
console.log('M98 PASS: water remains responsive, does not seize Property ownership, and respects mode.');
