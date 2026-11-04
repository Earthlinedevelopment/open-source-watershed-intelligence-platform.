import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {existsSync,statSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const ROOT=process.cwd(),BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mantra101-synthetic';mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1500,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.route('**/*',async route=>{let u=new URL(route.request().url());
 if(u.origin!==new URL(BASE).origin)return route.continue();
 let rel;try{rel=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html';}catch{return route.abort();}
 const file=path.resolve(ROOT,rel);if(file!==ROOT&&!file.startsWith(ROOT+path.sep))return route.abort();
 if(existsSync(file)&&statSync(file).isFile()){
  const ext=path.extname(file).toLowerCase(),mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.geojson':'application/geo+json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.css':'text/css'};
  return route.fulfill({status:200,contentType:mime[ext]||'application/octet-stream',body:readFileSync(file)});
 }
 return route.continue();
});
let result=null;
try{
 await page.goto(BASE+'?m101_svg_control=1',{waitUntil:'domcontentloaded',timeout:50000});
 await page.waitForFunction(()=>typeof window.earthlineRenderRegionalOverlay16020==='function'&&
   ((typeof window.earthlineMap!=='undefined'&&window.earthlineMap)||null)?.unproject,null,{timeout:45000});
 result=await page.evaluate(()=>{
  const map=window.earthlineMap,center=map.getCenter?.(),w=map.getContainer().clientWidth||1250,h=map.getContainer().clientHeight||750;
  const target=[[.22,.42],[.32,.36],[.45,.39],[.56,.35],[.67,.40],[.78,.38]].map(([x,y])=>{const q=map.unproject([w*x,h*y]);return [q.lng,q.lat]});
  const contour={type:'Feature',properties:{feature_type:'contour',elev_m:130,major:1},geometry:{type:'LineString',coordinates:target}};
  const swale={type:'Feature',properties:{feature_type:'swale-opportunity',grade:'A',score:89},geometry:{type:'LineString',coordinates:target}};
  window.earthlineRenderRegionalOverlay16020({contours:{type:'FeatureCollection',features:[contour]},swales:{type:'FeatureCollection',features:[swale]},flows:{type:'FeatureCollection',features:[]}});
  const c=document.querySelector('g[data-layer="numbered-elevation-contours"] path'),s=document.querySelector('g[data-layer="swale-opportunities"] path');
  return {center:{lng:center.lng,lat:center.lat},mapWidth:w,mapHeight:h,contourPath:c?.getAttribute('d')||null,swalePath:s?.getAttribute('d')||null,swalePathCount:document.querySelectorAll('g[data-layer="swale-opportunities"] path').length,swaleTexturedVisible:document.querySelectorAll('[id^="earthline-swale-planting"][visibility="visible"]').length};
 });
 await page.screenshot({path:OUT+'/swale-polyline.png',fullPage:false});
 assert.ok(result?.swalePath?.includes(' L '),'Swale SVG must retain source vertices as straight segments');
 assert.ok(!result.swalePath.includes(' C '),'Swale SVG MUST NOT use cubic splines');
 assert.ok(result.swalePathCount>=2,'Published safe swale must have visible vector strokes');
 assert.ok(result?.contourPath?.includes(' C '),'Existing elevation contour renderer must remain unchanged');
 assert.equal(errors.length,0,'No JS page errors');
 console.log('M101_SYNTHETIC_SWALERENDER_PASS '+JSON.stringify({...result,swalePath:result.swalePath.slice(0,250),contourPath:result.contourPath.slice(0,120)}));
}catch(err){console.error('M101_SYNTHETIC_SWALERENDER_FAIL '+String(err)+' '+JSON.stringify(result)+' errors='+JSON.stringify(errors.slice(0,5)));process.exitCode=1;}
finally{writeFileSync(OUT+'/synthetic.json',JSON.stringify({result,errors},null,2));await browser.close();}
