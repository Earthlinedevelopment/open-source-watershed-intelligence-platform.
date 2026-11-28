import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';

const source=readFileSync('earthline-elder-restored-17097.js','utf8');
const start=source.indexOf('  async function startProperty17166(){');
const end=source.indexOf('  async function refresh(){',start);
assert.ok(start>=0&&end>start,'single governed Elder Property owner');
const fn=source.slice(start,end);
new Script(fn,{filename:'elder-property.js'});
assert.ok(fn.includes("propertyRunIdentity17166(propertyBounds17166())===runIdentity"),'retry restricted to same target');
assert.ok(fn.includes('dynamic=await dynamicPropertyEvidence(true);'),'retry is real work, not a fabricated result');

async function run(outcomes,{supersede=false}={}){
  const events=[];let identity='property-1';
  const state={loaded:true,dynamic:{error:null},active:[],lastSummary:null};
  const window={EARTHLINE_ELDER_TREE_LAST_17097:{state:'property-pending',propertyRunIdentity:identity,visibleAt:'yes'}};
  const ctx={
    state,window,document:{getElementById:()=>null},
    propertyBounds17166:()=>[0,0,1,1],
    propertyRunIdentity17166:()=>identity,
    elderTierM94:()=> 'property',
    publishPropertyProvisional17389:()=>{events.push('provisional');return true;},
    load:async()=>{},
    dynamicPropertyEvidence:async()=>{
      const index=events.filter(e=>e==='worker').length;events.push('worker');
      const outcome=outcomes[index]??null;
      if(outcome==='reject'){
        state.dynamic.error='transient network';
        if(supersede)identity='property-2';
        return null;
      }
      state.dynamic.error=null;
      return outcome;
    },
    summarize:features=>({count:features.length}),
    publishMap:()=>{events.push('publish');return true},
    refreshSurfaces:()=>events.push('refresh'),
    deferMapRetryM94:()=>events.push('defer')
  };
  const f=runInNewContext(fn+'\n;startProperty17166',ctx);
  const result=await f();
  return {events,state,window,result};
}
const found={type:'FeatureCollection',features:[{geometry:{type:'Point',coordinates:[0,0]},properties:{}}],earthline:{candidate_pool_count:1}};
let r=await run(['reject',found]);
assert.equal(r.events.filter(x=>x==='worker').length,2,'one bounded retry after actual worker failure');
assert.equal(r.events.filter(x=>x==='publish').length,1);
assert.equal(r.window.EARTHLINE_ELDER_TREE_LAST_17097.state,'committed');
assert.equal(r.window.EARTHLINE_ELDER_TREE_LAST_17097.featureCount,1);
r=await run(['reject','reject','reject']);
assert.equal(r.events.filter(x=>x==='worker').length,2,'maximum two attempts');
assert.equal(r.window.EARTHLINE_ELDER_TREE_LAST_17097.state,'failed','never fabricate success');
r=await run(['reject',found],{supersede:true});
assert.equal(r.events.filter(x=>x==='worker').length,1,'never retry after target changes');
assert.equal(r.window.EARTHLINE_ELDER_TREE_LAST_17097.state,'property-pending','never write stale failure');
r=await run([found]);
assert.equal(r.events.filter(x=>x==='worker').length,1,'success without unnecessary retry');
assert.equal(r.window.EARTHLINE_ELDER_TREE_LAST_17097.state,'committed');
console.log('PASS: transient Elder worker retry once; no duplicate on success; stale target not retried; persistent failures marked failed; science unchanged.');
