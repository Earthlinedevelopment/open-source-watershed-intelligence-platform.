import {readFileSync} from 'node:fs';
import {Script,runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';

const html=readFileSync('index.html','utf8');
const start='  function relevantStyleLayers(){';
const end='  function bbox15788(coords){';
const a=html.indexOf(start),b=html.indexOf(end,a);
assert.ok(a>=0&&b>a,'final 15788 exclusion-layer selector exists');
assert.equal(html.indexOf(start,a+1),-1,'only one final selector');
const source=html.slice(a,b).trim();
new Script(source,{filename:'relevantStyleLayers-15788.js'});

const physical=[
  {id:'mapbox-road-primary',source:'composite',type:'line','source-layer':'road'},
  {id:'mapbox-street',source:'composite',type:'line','source-layer':'street'},
  {id:'mapbox-building',source:'composite',type:'fill-extrusion','source-layer':'building'},
  {id:'mapbox-water',source:'composite',type:'fill','source-layer':'water'},
  {id:'mapbox-wetland',source:'composite',type:'fill','source-layer':'wetland'}
];
const outputs=[
  {id:'earthline-property-safe-water-16221',source:'earthline-property-safe-source-16221',type:'line'},
  {id:'earthline-property-flow-15792',source:'earthline-property-flow-15792',type:'line'},
  {id:'earthline-property-swale-water-16174',source:'composite',type:'line','source-layer':'water'},
  {id:'el-live-water-15970',source:'el-live-water-15970',type:'line'},
  {id:'water-looking-layer',source:'earthline-generated-swales',type:'line','source-layer':'water'},
  {id:'earthline_recharge_water',source:'earthline_recharge',type:'line'}
];
const irrelevant=[
  {id:'mapbox-country-label',source:'composite',type:'symbol','source-layer':'country_label'}
];
const style={layers:[...physical,...outputs,...irrelevant]};
const sandbox={earthlineMap:{getStyle:()=>style}};
const select=runInNewContext(source+'; relevantStyleLayers',sandbox);
const selected=select().map(l=>l.id);
assert.deepEqual(selected,[...physical].map(l=>l.id),
 'Only physical Mapbox map layers can veto swale publication; generated output layers never count as safety evidence');
for(const f of outputs)assert.ok(!selected.includes(f.id),'Generated layer erroneously accepted: '+f.id);
for(const f of physical)assert.ok(selected.includes(f.id),'Actual exclusion lost: '+f.id);

const primary=html.indexOf("const ownedLayer=String(l&&l.id||'');");
assert.ok(primary>=0&&primary<a,'primary 16516 mapped-exclusion guard preserved');
assert.ok(html.slice(a,b).includes("const ownedLayer=String(l&&l.id||'');"),'final clearance guard installed');
for(const section of [
 'function earthlineFrozenPropertyClearanceAudit16255(collection){',
 'function earthlineFilterRoadOverlaps16397(collection){',
 'function earthlineLockPropertyResult15815(force=false){',
 'function auditCorridors15806(fc,force=false){'
])assert.ok(html.includes(section),'approved safety enforcement preserved: '+section);
console.log('PASS: underlying roads, structures, wetlands and water preserved; generated swales/flow/water cannot become next-run exclusions');
