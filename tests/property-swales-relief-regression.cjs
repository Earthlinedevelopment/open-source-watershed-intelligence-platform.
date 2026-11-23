/* Regression for the unapproved R14 whole-parcel relief veto.
   Synthetic fixture only: proves an arbitrary 1m gate can suppress accepted swales,
   not that actual NY terrain or canopy/road coverage are accurate.
   Run: node tests/property-swales-relief-regression.cjs */
'use strict';
const assert=require('node:assert/strict');
const engine=require('../earthline-property-swales.js');
const w=60,h=60,n=w*h,cellM=2;
const elev=new Float32Array(n);
const landcover=new Uint8Array(n);
for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  elev[y*w+x]=400+0.004*y+0.003*x;
  if(x<15)landcover[y*w+x]=1;
}
const fixture={
  grid:{w,h,cellM,bbox:[-75.771,42.787,-75.769,42.789],elev},
  inside:new Uint8Array(n).fill(1),
  exclusions:{status:'verified-clear',sourceTier:'authoritative-local',built:new Uint8Array(n),water:new Uint8Array(n)},
  landcover,elevationSource:'SYNTHETIC REGRESSION — not USGS'
};
const fresh=engine.run(fixture);
const oldGate=engine.run({...fixture,minReliefM:1});
assert.equal(engine.LIMITS.minReliefM,0,'proposed R14 must not be enforced by default');
assert.ok(fresh.evidence.terrain.reliefM<1,'fixture must have less than 1m relief');
assert.ok(fresh.swales.length>0,'qualified swales must survive when relief<1m');
assert.equal(oldGate.swales.length,0,'old gate must suppress same otherwise qualifying swales');
assert.equal(oldGate.evidence.terrain.swalesSuppressedByGate,fresh.swales.length);
assert.ok((fresh.rejections.R15||0)>0,'forest filter must actually reject candidates');
assert.equal(fresh.determinismHash,engine.run(fixture).determinismHash,'same inputs must be deterministic');
console.log('PASS: R14 synthetic regression; swales='+fresh.swales.length+' relief='+fresh.evidence.terrain.reliefM);
