/* Earthline October-line Property aquifer guard tests.
 * Reads the candidate IIFE from the repository; never touches production.
 * Seven repeated lifecycle cycles, plus fail-closed cases.
 */
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync('earthline-launch-16872.js','utf8');
const anchor='/* MANTRA PROPERTY AQUIFER VISIBILITY CANDIDATE';
const index=source.indexOf(anchor);
assert(index>=0,'candidate block absent');
const code=source.slice(index);
let calls=[],timers=[],events={},layers={},sources={},displayed={tier:'property',runToken:'p1'},docTier='property';
const map={
  getLayer:id=>layers[id]||null,
  getSource:id=>sources[id]||null,
  getLayoutProperty:id=>layers[id]?.visibility||'visible',
  setLayoutProperty:(id,key,value)=>{assert.equal(key,'visibility');calls.push([id,value]);layers[id].visibility=value;}
};
const window={EARTHLINE_DISPLAYED_RUN_16151:displayed,earthlineMap:map};
const document={
  documentElement:{dataset:{get earthlineAnalysisTier(){return docTier}}},
  addEventListener:(type,fn)=>{(events[type]??=[]).push(fn);}
};
const context={window,document,setTimeout:(fn,ms)=>{timers.push([fn,ms]);return timers.length},Date};
vm.runInNewContext(code,context,{timeout:1000});
const idFill='el-live-aquifer-fill-15970';
const idLine='el-live-aquifer-line-15970';
function tick(){
  for(const f of events['earthline:analysis-complete']||[])f();
  while(timers.length)timers.shift()[0]();
  return window.EARTHLINE_PROPERTY_AQUIFER_VISIBILITY_CANDIDATE.last;
}
function reset(){calls=[];timers=[];layers={};sources={};docTier='property';displayed={tier:'property',runToken:'p1'};window.EARTHLINE_DISPLAYED_RUN_16151=displayed;}
for(let run=1;run<=7;run++){
  reset();displayed.runToken='p'+run;
  layers[idFill]={source:'aquifer',visibility:'none'};
  layers[idLine]={source:'aquifer',visibility:'none'};
  sources.aquifer={type:'geojson'};
  const result=tick();
  assert.equal(result.runToken,'p'+run);
  assert.equal(result.complete,true);
  assert.equal(calls.length,2,'exactly two existing layers restored per run');
  assert.equal(layers[idFill].visibility,'visible');
  assert.equal(layers[idLine].visibility,'visible');
}
// Missing source is NOT a successful repair.
reset();layers[idFill]={source:'missing',visibility:'none'};layers[idLine]={source:'missing',visibility:'none'};
assert.equal(tick().complete,false);assert.equal(calls.length,0);
// Missing layer is NOT a successful repair.
reset();layers[idFill]={source:'aquifer',visibility:'none'};sources.aquifer={};
assert.equal(tick().complete,false);
// Regional event cannot mutate Property aquifer visibility.
reset();displayed.tier='regional';layers[idFill]={source:'aquifer',visibility:'none'};sources.aquifer={};
tick();assert.equal(calls.length,0);
// Document tier mismatch cannot mutate source.
reset();docTier='regional';layers[idFill]={source:'aquifer',visibility:'none'};sources.aquifer={};
tick();assert.equal(calls.length,0);
console.log('PASS: seven repeat Property visibility cycles and four fail-closed cases');
