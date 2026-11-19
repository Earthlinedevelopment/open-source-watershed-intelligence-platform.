// Offline check of boundaryAudit with a hand-made state (a 1 degree square) and corridors with known positions.
import {chromium} from 'playwright';
import {boundaryAudit} from './boundary-audit.mjs';
const sq={type:'FeatureCollection',features:[{type:'Feature',properties:{},geometry:{type:'MultiPolygon',coordinates:[[[[-74,41],[-73,41],[-73,42],[-74,42],[-74,41]]]]}}]};
const browser=await chromium.launch({headless:true});const page=await browser.newPage();
await page.route('https://state.test/**',r=>r.request().url().endsWith('.geojson')?r.fulfill({contentType:'application/json',body:JSON.stringify(sq)}):r.fulfill({contentType:'text/html',body:'<html></html>'}));
await page.goto('https://state.test/');
const L=(...c)=>({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:c}});
const out=await page.evaluate(async ({fn,arg})=>{
  window.earthlineMap={getSource:()=>({_data:{features:[
    L([-73.5,41.5],[-73.4,41.6]),                 // wholly inside
    L([-73.5,41.5],[-72.995,41.5]),               // last vertex ~0.005 deg (~420 m) outside the east edge
    L([-73.5,41.5],[-72.9,41.5]),                 // last vertex 0.1 deg (~8 km) outside
    L([-74.2,41.5],[-74.1,41.6]),                 // wholly outside (~16 km)
  ]}})};
  function L(...c){return {type:'Feature',properties:{},geometry:{type:'LineString',coordinates:c}};}
  return (new Function('return '+fn))()(arg);
},{fn:boundaryAudit.toString(),arg:{path:'/data/x/NY.geojson',sourceId:'any'}});
await browser.close();
console.log(JSON.stringify(out));
const c=[['audit ok',out.ok],['8 vertices checked',out.vertices===8],['4 outside vertices',out.outside===4],['3 features have outside vertices',out.featuresWithOutsideVertices===3],
 ['only the 8 km and 16 km cases beyond 500 m (3 vertices: 1 + 2)',out.outsideBeyond500m===3],['worst ~16 km',out.worstOutsideM>14000&&out.worstOutsideM<18000]];
let bad=0;for(const [n,ok] of c){console.log((ok?'PASS ':'FAIL ')+n);if(!ok)bad++;}process.exit(bad?1:0);
