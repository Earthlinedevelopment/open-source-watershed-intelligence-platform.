import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync('index.html','utf8');
const start=html.indexOf('  function applyOwnership(mode){');
const end=html.indexOf('  function setSwalesOnly(',start+5);
assert.ok(start>0,'Regional/Property ownership controller must exist');
const owner=html.slice(start,start+6500);
assert.match(owner,/if\(property\)\{setGroup\(active\.swales,swaleOn\);\}/,'Property renderer must stay intact');
assert.match(owner,/for\(const id103 of \["earthline-swales-casing","earthline-swales-line",OPPORTUNITY_SOIL,OPPORTUNITY_PLANT,OPPORTUNITY_WATER\]\)visible\(id103,false\)/,'Legacy Regional swale drawings never reactivate');
assert.match(owner,/visible\(OPPORTUNITY_LABEL,swaleOn\)/,'Regional opportunity controls remain available');
assert.ok(!owner.includes('setGroup(active.water,flowOn);setGroup(active.swales,swaleOn);'),'Legacy Regional unconditional swale visibility must be absent');
function extract(prefix){
 const at=html.indexOf(prefix);
 assert.ok(at>=0,'Missing '+prefix);
 const open=html.indexOf('{',at);let depth=0;
 for(let i=open;i<html.length;i++){if(html[i]==='{')depth++;else if(html[i]==='}'&&--depth===0)return html.slice(at,i+1);}
 throw Error('Unterminated '+prefix);
}
const fn=extract('function applyTierStyling(){');
for(const tierValue of ['regional','focus','property']){
 const events=[];
 const ORIGINAL=['earthline-swales-casing','earthline-swales-line','earthline-ranked-swale-soil-15777','earthline-ranked-swale-plant-15777','earthline-ranked-swale-water-15777'];
 const FOCUS={casing:'focus-casing',ditch:'focus-ditch'};
 const PROPERTY={ditch:'property-ditch',canopy:'property-canopy'};
 const ctx={tier:()=>tierValue,ensureFocusLayers:()=>{},ensurePropertyLayers:()=>{},ORIGINAL,FOCUS,PROPERTY,LOCATION_HIT:'opportunity-hit',LOCATION_LABEL:'opportunity-label',visible:(id,on)=>events.push({id,on}),map:()=>({getLayer:()=>null}),setPaint:()=>{},window:{},BUILD:'test',lastTier:'',Date};
 vm.runInNewContext(fn+'\napplyTierStyling();',ctx,{timeout:2000});
 assert.ok(ORIGINAL.every(id=>events.find(e=>e.id===id)?.on===false),'Legacy strokes visible at tier '+tierValue);
 assert.equal(events.find(e=>e.id==='property-ditch')?.on,tierValue==='property','Property mode preservation');
 assert.equal(events.find(e=>e.id==='opportunity-hit')?.on,tierValue!=='property','Opportunity hit preservation');
 assert.equal(ctx.window.EARTHLINE_SWALE_RENDERING_AUDIT_16166.regionalOriginalVisible,false);
}
const svg=extract('function hideNative(){');
for(const id of ['earthline-swales-casing','earthline-swales-line','earthline-ranked-swale-soil-15777','earthline-ranked-swale-plant-15777','earthline-ranked-swale-water-15777'])assert.ok(svg.includes(id),'SVG owner must retire '+id);
assert.ok(html.includes('function earthlineSwalePolylineM102(pts){'),'M102 source-aligned geometry retained');
assert.ok(html.includes('function earthlineWormGeometryPassRegional101(points){'),'M101 regional worm geometry gate retained');
assert.ok(html.includes('function earthlineWormGeometryPass101(points){'),'M101 property worm geometry gate retained');
console.log('MANTRA103_SINGLE_REGION_SWALE_OWNER_PASS: no resurrected legacy worms; Property, Elders, native water and opportunity controls untouched');

assert.match(html,/vis\("earthline-swales-casing",false\);vis\("earthline-swales-line",false\);/,'Old swale-casing and line owners must be off after every sync');
assert.match(html,/for\(const id of \[OPPORTUNITY_SOIL,OPPORTUNITY_PLANT,OPPORTUNITY_WATER\]\)vis\(id,false\)/,'Old native opportunity strokes must be off after every sync');
assert.match(html,/for\(const id of \[OPPORTUNITY_HIT_16153,OPPORTUNITY_LABEL\]\)vis\(id,oOn\)/,'Opportunity chip controls stay on');
