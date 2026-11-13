import {test} from 'node:test';
import assert from 'node:assert/strict';
import {screenProperty,validateCandidate} from '../earthline-property-swales.js';
const boundary=[[0,0],[1,0],[1,1],[0,1]];
const input={boundary,elevation:{complete:true,bareEarth:true,source:'fixture-LiDAR'},
 exclusion:{complete:true,acquisition:'features-found',source:'fixture-authoritative'},cellSizeM:1,runId:'test'};
const mk=(slope=3,y=0)=>({
 id:'fixture-'+y,points:[[0,y],[25,y],[50,y],[75,y],[100,y]],lngLat:[[0,0],[.0002,0],[.0004,0],[.0006,0],[.0008,0]],
 slopes:[slope,slope,slope,slope,slope],elevations:[100,100.03,100.06,100.08,100.10],
 obstructionDistanceM:20,mappedWaterDistanceM:25,modeledChannelDistanceM:8,insideProperty:true,
 propertyBoundaryDistanceM:25,drawdownHours:24});
test('valid 100 m swale is NOT rejected by a supposed 40 m maximum',()=>{
 const result=screenProperty({...input,candidates:[mk()]});
 assert.equal(result.status,'screened');assert.equal(result.swales.length,1);
 assert.equal(result.swales[0].length_m,100);
});
test('reject all sustained 33% slopes and a five-sample steep stretch',()=>{
 assert.equal(validateCandidate(mk(33),{cellSizeM:1}).reason,'R2');
 const c=mk();c.slopes=[1,4.1,4.1,4.1,1];
 assert.equal(validateCandidate(c,{cellSizeM:1}).reason,'R3');
});
test('exclude washed channels, mapped waterways and roads separately',()=>{
 const variants=[['modeledChannelDistanceM',2.9,'R8'],['mappedWaterDistanceM',17.9,'R7'],['obstructionDistanceM',3,'R6']];
 for(const [key,val,expected] of variants){const c=mk();c[key]=val;assert.equal(validateCandidate(c,{cellSizeM:1}).reason,expected)}
});
test('spacing is enforced between accepted swales',()=>{
 const result=screenProperty({...input,candidates:[mk(3,0),mk(3,2)]});
 assert.equal(result.swales.length,1);assert.equal(result.rejections.R5,1);
});
test('failed exclusion acquisitions are not treated as empty',()=>{
 for(const acquisition of ['failed','unavailable',undefined]){
  const result=screenProperty({...input,exclusion:{complete:false,acquisition},candidates:[mk()]});
  assert.equal(result.status,'failed');assert.equal(result.swales.length,0);
 }
});
test('non-bare-earth elevation is rejected',()=>{
 const r=screenProperty({...input,elevation:{complete:true,bareEarth:false},candidates:[mk()]});
 assert.equal(r.status,'failed');assert.equal(r.swales.length,0);
});
test('same inputs produce identical results',()=>{
 const a=screenProperty({...input,candidates:[mk()]});
 const b=screenProperty({...input,candidates:[mk()]});
 assert.deepEqual(a,b);
});
