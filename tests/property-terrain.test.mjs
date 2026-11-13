import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzeBareEarthGrid,rasterizeNoBuild} from '../earthline-property-terrain.js';
const grid=(values)=>({width:5,height:5,cellSizeM:5,bareEarth:true,complete:true,elevations:values});
const exclusions=(overrides={})=>({
  complete:true,acquisition:'features-found',roads:[],buildings:[],driveways:[],parking:[],
  propertyBoundary:[],water:[],wetlands:[],...overrides
});
test('flat elevation has zero slope and no invented flow',()=>{
 const r=analyzeBareEarthGrid(grid(Array(25).fill(100)));
 assert.equal(Math.max(...r.slopes),0);
 assert.equal(Math.max(...r.accumulation),1);
 assert.ok([...r.downstream].every(i=>i===-1));
});
test('5 m cells with 1 m eastward fall produce 20% slopes',()=>{
 const r=analyzeBareEarthGrid(grid(Array.from({length:25},(_,i)=>100-i%5)));
 assert.equal(Math.max(...r.slopes),20);
 assert.equal(r.accumulation[4],5);
});
test('missing bare-earth provenance or incomplete raster fails closed',()=>{
 for(const g of [{...grid(Array(25).fill(0)),bareEarth:false},{...grid(Array(25).fill(0)),complete:false}]){
  assert.throws(()=>analyzeBareEarthGrid(g),/Verified bare-earth/);
 }
 assert.throws(()=>analyzeBareEarthGrid(grid(Array(24).fill(0))),/Incomplete elevation/);
});
test('roads, buildings, driveways, parking, boundary, water, wetlands and modeled channels exclude cells',()=>{
 for(const key of ['roads','buildings','driveways','parking','propertyBoundary','water','wetlands']){
  const mask=rasterizeNoBuild({width:5,height:5,cellSizeM:5,exclusions:exclusions({[key]:[12]})});
  assert.equal(mask[12],1,key);
 }
 const mask=rasterizeNoBuild({width:5,height:5,cellSizeM:5,exclusions:exclusions(),channelIndices:[12]});
 assert.equal(mask[12],1);
});
test('18 m mapped-water setback excludes adjacent terrain cells',()=>{
 const m=rasterizeNoBuild({width:9,height:9,cellSizeM:5,exclusions:exclusions({water:[40]})});
 assert.equal(m[40],1);
 assert.equal(m[40+3],1);
 assert.equal(m[40+4],0);
});
test('missing exclusion classes and failed acquisition are not verified-clear',()=>{
 assert.throws(()=>rasterizeNoBuild({width:5,height:5,cellSizeM:5,exclusions:{complete:true,acquisition:'verified-clear',roads:[],water:[]}}),/unverified/);
 assert.throws(()=>rasterizeNoBuild({width:5,height:5,cellSizeM:5,exclusions:exclusions({acquisition:'failed'})}),/unverified/);
});
test('deterministic across five identical terrain runs',()=>{
 const source=grid(Array.from({length:25},(_,i)=>100-i%5));
 const hash=x=>JSON.stringify({slopes:[...x.slopes],accumulation:[...x.accumulation],downstream:[...x.downstream]});
 const signatures=Array.from({length:5},()=>hash(analyzeBareEarthGrid(source)));
 assert.equal(new Set(signatures).size,1);
});
