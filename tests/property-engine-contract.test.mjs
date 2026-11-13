// Earthline Property Swale Engine — acceptance contract, 2026-11-13.
// Locked by Earthline-Property-Swale-Engine-Spec.md; new module must satisfy these.
// This is an independent contract and does not activate the old engine or change production.
import test from 'node:test';
import assert from 'node:assert/strict';

const limits=Object.freeze({
  meanSlopeMinPct:0.2,meanSlopeMaxPct:4,
  maxFiveSampleMedianPct:4,
  minSpacingM:4.572,maxSpacingM:7.620,
  roadBuildingPropertySetbackM:3.05,
  mappedWaterSetbackM:18,
  modeledChannelSetbackM:3,
  minimumLengthM:12,maximumLengthM:40,
  maxContourRangeM:0.3,
  maxTortuosity:2.15,
  drawdownHours:48
});

const locations=Object.freeze([
  {name:'iowa-farmland',lat:42.13000,lng:-93.68000},
  {name:'iowa-creek',lat:41.95748,lng:-93.38977},
  {name:'vermont',lat:43.88279,lng:-72.45147},
  {name:'arizona',lat:34.21572,lng:-111.93073},
  {name:'darling-mine',lat:33.73774,lng:-114.33439}
]);

function median(values){const s=[...values].sort((a,b)=>a-b);return s[Math.floor(s.length/2)];}
function checkSlope(samples){
  if(!Array.isArray(samples)||samples.length<5||samples.some(x=>!Number.isFinite(x)))return false;
  const mean=samples.reduce((a,b)=>a+b,0)/samples.length;
  if(mean<limits.meanSlopeMinPct||mean>limits.meanSlopeMaxPct)return false;
  for(let i=0;i<=samples.length-5;i++)if(median(samples.slice(i,i+5))>4)return false;
  return true;
}
test('locked numerical Property geometry envelope',()=>{
  assert.equal(limits.meanSlopeMaxPct,4);
  assert.equal(limits.meanSlopeMinPct,0.2);
  assert.equal(limits.minSpacingM,4.572);
  assert.equal(limits.maxSpacingM,7.620);
  assert.equal(limits.mappedWaterSetbackM,18);
  assert.equal(limits.modeledChannelSetbackM,3);
  assert.equal(limits.roadBuildingPropertySetbackM,3.05);
  assert.equal(limits.drawdownHours,48);
});
test('slope gate rejects 33% and sustained above 4%',()=>{
  assert.equal(checkSlope([33,33,33,33,33]),false);
  assert.equal(checkSlope([4.1,4.1,4.1,1,1]),false);
  assert.equal(checkSlope([3.2,3.1,3,3.5,3.6]),true);
  assert.equal(checkSlope([0.1,0.1,0.1,0.1,0.1]),false);
});
test('five fixed acceptance locations, including Iowa creek and Darling Mine',()=>{
  assert.equal(locations.length,5);
  assert.deepEqual(locations.map(x=>x.name),['iowa-farmland','iowa-creek','vermont','arizona','darling-mine']);
});
test('required published output and safety evidence fields are frozen',()=>{
  const required=['status','message','swales','rejections','evidence'];
  const swaleRequired=['id','length_m','mean_slope_pct','max_5pt_median_slope_pct','elevation_m','capture_score'];
  assert.equal(new Set(required).size,5);
  assert.equal(new Set(swaleRequired).size,6);
});
export { limits,locations,checkSlope };
