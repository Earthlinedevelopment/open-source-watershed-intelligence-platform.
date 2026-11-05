import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync('index.html','utf8');
const start=html.indexOf('function earthlineArcGISJsonp16399(');
const end=html.indexOf('async function earthlineFetchArcGISGeoJSON16398(',start);
assert.ok(start>0&&end>start,'ArcGIS JSONP transport source must exist');
const src=html.slice(start,end);
assert.ok(src.includes('window[cb]=()=>{}'),'settled ArcGIS callback must be inert, not deleted');

function setup(){
  const globals={},timers=[],scripts=[];
  const context={
    window:globals,URLSearchParams,Date,Math,JSON,Error,Promise,
    document:{
      createElement:()=>({async:false,src:'',remove(){this.removed=true;}}),
      head:{appendChild(el){scripts.push(el);}}
    },
    setTimeout(fn,ms){const handle={fn,ms};timers.push(handle);return handle;},
    clearTimeout(handle){handle.cleared=true;},
    earthlineEsriToGeoJSON16399:json=>({type:'FeatureCollection',features:json.features||[]})
  };
  const fn=vm.runInNewContext(src+';earthlineArcGISJsonp16399',context,{timeout:3000});
  const bb={minLng:-75,minLat:43,maxLng:-72,maxLat:45};
  const callback=()=>new URL(scripts.at(-1).src).searchParams.get('callback');
  return {fn,bb,globals,timers,scripts,callback};
}

// A delayed script is allowed to execute in the browser even when its
// associated request has timed out and its script element was removed.
const slow=setup();
const pending=slow.fn('https://service.invalid/ArcGIS/query',slow.bb,'OBJECTID',40);
assert.equal(slow.scripts.length,1);
const expired=slow.callback();
assert.equal(typeof slow.globals[expired],'function');
slow.timers[0].fn();
await assert.rejects(pending,/ArcGIS JSONP timeout/);
assert.equal(slow.scripts[0].removed,true);
assert.equal(typeof slow.globals[expired],'function','tombstone prevents uncaught ReferenceError on late script');
assert.doesNotThrow(()=>slow.globals[expired]({features:[{id:9}]}),'late response must not throw');
assert.equal(slow.globals[expired](),undefined,'late response must not publish data');

// Successful current responses must still resolve and not change on a late replay.
const fast=setup();
const success=fast.fn('https://service.invalid/ArcGIS/query',fast.bb,'OBJECTID',40);
const current=fast.callback();
fast.globals[current]({features:[{id:1}]});
const data=await success;
assert.equal(data.transport,'jsonp');
assert.equal(data.json.features.length,1);
assert.equal(fast.timers[0].cleared,true);
assert.equal(fast.globals[current]({features:[{id:2}]}),undefined,'replayed response cannot mutate settled evidence');

console.log('MANTRA114_ARCGIS_JSONP_RACE_PASS: expired, late and replayed callbacks are inert; current success still publishes');
