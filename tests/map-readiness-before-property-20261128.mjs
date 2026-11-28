import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
import assert from 'node:assert/strict';

const html=readFileSync('index.html','utf8');
const needle='async function earthlineWaitForMappedExclusionStyle15862B(myGen=M.searchGen,timeoutMs=5000){';
const a=html.indexOf(needle),z=html.indexOf('async function earthlineBuildVectorNoBuildMask(myGen=M.searchGen)',a);
assert.ok(a>=0&&z>a,'existing Mapbox exclusion readiness owner');
const fn=html.slice(a,z);new Script(fn);
assert.ok(fn.includes('earthlineMap.isSourceLoaded(sourceId)'),'original mapped-source readiness check preserved');
assert.ok(fn.includes('status:"map-initialization-timeout"'),'map initialization is bounded');
assert.ok(fn.includes('styleHasLayers()'),'real mapped exclusion layers still required');

async function exercise({activeAfter=0,stale=false,timeout=5000}={}){
 let active=activeAfter===0,clock=0,waits=0;
 const ctx={
   M:{searchGen:1},
   earthlineMapActive:()=>active,
   earthlineIsStale:()=>stale,
   performance:{now:()=>clock},
   setTimeout:fn=>{waits++;clock+=100;if(waits>=activeAfter)active=true;fn();return waits},
   clearTimeout:()=>{},
   requestAnimationFrame:fn=>fn(),
   earthlineMap:{
     getStyle:()=>({layers:[{id:'road-main',type:'line',source:'composite','source-layer':'road'}]}),
     isSourceLoaded:()=>true,
     on:()=>{},off:()=>{}
   }
 };
 const f=runInNewContext(fn+'\n; earthlineWaitForMappedExclusionStyle15862B',ctx);
 return {result:await f(1,timeout),waits};
}
let r=await exercise({activeAfter:3});
assert.equal(r.result.ready,true,'initializing Mapbox becomes queryable without false failure');
assert.ok(r.waits>=3,'waited for map initialization');
r=await exercise({activeAfter:0});
assert.equal(r.result.ready,true);
assert.equal(r.waits,0,'already active Mapbox has no startup penalty');
r=await exercise({activeAfter:999,timeout:500});
assert.equal(r.result.ready,false);
assert.equal(r.result.status,'map-initialization-timeout','still fails closed without data');
r=await exercise({activeAfter:999,stale:true});
assert.equal(r.result.ready,false);
assert.equal(r.result.status,'stale-before-map-initialization','stale ownership never publishes');
console.log('PASS: first Property waits for real Mapbox evidence; already-loaded map instantaneous; unavailable/stale sources fail closed.');
