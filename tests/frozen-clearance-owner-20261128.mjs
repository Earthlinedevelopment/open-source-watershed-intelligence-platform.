import {readFileSync} from 'node:fs';
import {runInNewContext,Script} from 'node:vm';
import assert from 'node:assert/strict';

const html=readFileSync('index.html','utf8');
const start='  function earthlineLockPropertyResult15815(force=false){';
const end='  window.earthlineLockPropertyResult15815=earthlineLockPropertyResult15815;';
const a=html.indexOf(start),z=html.indexOf(end,a);
assert.ok(a>=0&&z>a,'canonical Property safety owner exists');
assert.equal(html.indexOf(start,a+1),-1);
const fn=html.slice(a,z);
new Script(fn,{filename:'property-safety-owner.js'});
assert.ok(fn.includes('const portableEvidence16544='),'frozen source owner selected explicitly');
assert.ok(fn.includes('earthlineFrozenPropertyClearanceAudit16255(candidate)'),'run-specific no-build audit remains mandatory');
assert.ok(fn.includes('earthlineFilterRoadOverlaps16397(collection)'),'road overlap backstop remains');
assert.ok(fn.includes('window.earthlineFilterCorridors15788(raw,true)'),'authoritative-local map evidence gate remains');

function exercise(sourceTier,frozenVerified){
  const events=[];
  const coords=[[-75.778,42.789],[-75.777,42.7891]];
  const raw={type:'FeatureCollection',features:[
    {type:'Feature',properties:{id:'A'},geometry:{type:'LineString',coordinates:coords}},
    {type:'Feature',properties:{id:'B'},geometry:{type:'LineString',coordinates:coords}}
  ]};
  const M={
    searchGen:8,swales:[{id:'A'},{id:'B'}],authoritativePropertySwales15800:raw,
    noBuildMask:new Uint8Array(2500),vectorNoBuildCoverage:{
      verified:true,publicationAllowed:true,sourceTier,acquisitionResult:'features-found'
    }
  };
  const window={
    earthlineFilterCorridors15788(fc){
      events.push('map-camera-filter');
      return {collection:{...fc,features:fc.features.slice(0,1)},
        stats:{indexAvailable:true,inputCandidates:2,outputSegments:1}};
    },
    earthlineAuditCorridorClearance15806(fc){
      events.push('map-camera-audit');
      return {collection:fc,stats:{verified:true,acceptedIntersections:0,safeSegments:fc.features.length}};
    }
  };
  const ctx={
    window,M,
    spacingStats:(s)=>({populationCount:s.length}),
    earthlineEmptyPropertyFC16176:()=>({type:'FeatureCollection',features:[]}),
    earthlineSafeModelFromGeoJSON16176:(fc)=>fc.features.map(f=>({id:f.properties.id})),
    earthlineFrozenPropertyClearanceAudit16255:(fc)=>{
      events.push('frozen-mask');
      return {verified:frozenVerified,maskHits:frozenVerified?0:1,reasons:frozenVerified?[]:['published-corridor-intersects-frozen-no-build-mask']};
    },
    earthlineFilterRoadOverlaps16397:(fc)=>{
      events.push('physical-road-backstop');
      return {collection:fc,stats:{applied:true,removed:0}};
    },
    earthlineBlockPropertyPublication16176:(reason)=>{
      events.push('blocked:'+reason);
      M.authoritativeSafeSwales15815={type:'FeatureCollection',features:[]};
    }
  };
  const actual=runInNewContext(fn+'\n; earthlineLockPropertyResult15815',ctx)(true);
  return {events,M,actual};
}

const portable=exercise('open-data',true);
assert.equal(portable.actual.features.length,2,'all two frozen-mask-verified candidates survive');
assert.equal(portable.M.safetyAudit15806.verified,true);
assert.ok(portable.events.includes('frozen-mask'),'frozen audit executed');
assert.ok(portable.events.includes('physical-road-backstop'),'existing road backstop executed');
assert.ok(!portable.events.includes('map-camera-filter'),'volatile camera filter NOT an input');
assert.ok(!portable.events.includes('map-camera-audit'),'volatile camera audit NOT an input');

const blocked=exercise('open-data',false);
assert.ok(blocked.events.some(s=>s.startsWith('blocked:')),'non-verifying frozen masks fail closed');
assert.equal(blocked.M.authoritativeSafeSwales15815.features.length,0,'no unsafe publication');

const authoritative=exercise('authoritative-local',true);
assert.equal(authoritative.actual.features.length,1,'authoritative Vermont-style map audit unchanged');
assert.ok(authoritative.events.includes('map-camera-filter'));
assert.ok(authoritative.events.includes('map-camera-audit'));
assert.ok(!authoritative.events.includes('frozen-mask'),'no replacement of authoritative local behavior');

console.log('PASS: Portable Property uses only the frozen run-specific mask; all 2 valid swales preserved; invalid mask blocks; authoritative-local uses existing map filtering and no road backstop was removed.');
