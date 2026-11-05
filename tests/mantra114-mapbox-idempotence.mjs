import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync('index.html','utf8');
const lines=html.split('\n');
const findLine=(key)=>{const s=lines.find(line=>line.includes(key));assert.ok(s,'missing '+key);return s.trim();};
const compile=(key,ctx)=>{const name=key.match(/function\s+(\w+)/)?.[1];assert.ok(name);return vm.runInNewContext(findLine(key)+'\n'+name,ctx,{timeout:3000});};
const source=(value)=>({_data:value,writes:0,setData(v){this._data=v;this.writes++;}});
const empty={type:'FeatureCollection',features:[]};
const nonempty={type:'FeatureCollection',features:[{type:'Feature',geometry:{type:'Point',coordinates:[0,0]},properties:{}}]};
const src=source(empty);
const map={getSource:()=>src};
const regional=compile('function setData(id,data){',{earthlineMap:map});
regional('swales',empty);
assert.equal(src.writes,0,'same Regional data must not invalidate Mapbox tiles');
regional('swales',nonempty);
regional('swales',nonempty);
assert.equal(src.writes,1,'changed Regional source must publish exactly once');

src._data=empty;src.writes=0;
const live=compile('function setGeo(m,id,data){',{EMPTY:empty});
live(map,'flow',empty);
live(map,'flow',nonempty);
live(map,'flow',nonempty);
assert.equal(src.writes,1,'live native source must publish only on meaningful change');

src._data=empty;src.writes=0;
const restore=compile('function setSourceData(id,data){',{map:()=>map,clone:x=>JSON.parse(JSON.stringify(x))});
restore('contours',empty);
restore('contours',nonempty);
restore('contours',nonempty);
assert.equal(src.writes,1,'cached Regional restore must not write duplicate tiles');

let visibility='visible',visWrites=0;
const styleMap={
 getLayer:()=>({id:'layer'}),
 getLayoutProperty:()=>visibility,
 setLayoutProperty:(_,__,v)=>{visibility=v;visWrites++;}
};
const visLine=findLine('const vis=(id,on)=>{if(!earthlineMap.getLayer(id))return;');
const vis=vm.runInNewContext(visLine+'\nvis',{earthlineMap:styleMap},{timeout:3000});
vis('water',true);
vis('water',false);
vis('water',false);
vis('water',true);
assert.equal(visWrites,2,'visibility should change only on true tier state changes');

const paint={id:'layer'};
let paintWrites=0;
const restoredMap={
 getLayer:()=>paint,getLayoutProperty:()=>visibility,
 setLayoutProperty:(_,__,v)=>{visibility=v;visWrites++;},
 getPaintProperty:(_,p)=>p==='line-opacity'?0.9:undefined,
 setPaintProperty:()=>{paintWrites++;}
};
const restoreLayer=compile('function restoreLayerState(cache){',{map:()=>restoredMap,clone:x=>JSON.parse(JSON.stringify(x))});
visibility='visible';visWrites=0;
restoreLayer({layers:{'layer':{visibility:'visible',paint:{'line-opacity':0.9}}}});
assert.equal(visWrites,0);
assert.equal(paintWrites,0,'identical restored paints must not be rewritten');

const region=html.slice(html.indexOf('function syncLayers15778(mode='),html.indexOf('window.earthlineSyncLayers15778='));
assert.ok(region.includes('getLayoutProperty(id,"visibility")'),'regional visibility comparison missing');
const recovery=html.slice(html.indexOf('function forceVisible(mp){'),html.indexOf('function detachRecovery(){'));
assert.ok(recovery.includes('want')===false && recovery.includes('ids.every'),'swale reorder must check present layer order');
assert.ok(html.includes("/* M113: the late Regional preservation policy must be idempotent."),'accepted aquifer policy must remain');

let parsed=0;
for(const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)){
 const attrs=match[1]||'',body=match[2]||'';
 if(/\bsrc\s*=/.test(attrs)||/type\s*=\s*["'](?:application\/json|application\/ld\+json|module)["']/i.test(attrs)||!body.trim())continue;
 new vm.Script(body,{filename:'inline-'+(++parsed)+'.js'});
}
assert.ok(parsed>10,'expected full inline script coverage');
console.log('MANTRA114_IDEMPOTENT_MAPBOX_PASS: source, visibility, paint, layering and '+parsed+' inline scripts');
