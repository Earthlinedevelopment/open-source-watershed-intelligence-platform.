import { chromium } from 'playwright';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const ROOT=process.cwd();
const BASE='https://earthlinedevelopment.org/';
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.py':'text/plain; charset=utf-8'};
const fc=JSON.parse(readFileSync('data/elder-trees/v2/california-regional-overview.geojson','utf8'));
const features=(fc.features||[]).filter(f=>f?.geometry?.type==='Point'&&Array.isArray(f.geometry.coordinates));
if(features.length<6)throw new Error('Need at least six California known-tree controls');
const picks=[0,Math.floor(features.length*.18),Math.floor(features.length*.36),Math.floor(features.length*.54),Math.floor(features.length*.72),features.length-1]
  .map((i,n)=>({name:'known-tree-'+(n+1),lng:Number(features[i].geometry.coordinates[0]),lat:Number(features[i].geometry.coordinates[1])}));

function box20Acres({lat,lng}){
  const side=Math.sqrt(20*4046.8564224),half=side/2;
  const dLat=half/111320;
  const dLng=half/(111320*Math.cos(lat*Math.PI/180));
  return [lng-dLng,lat-dLat,lng+dLng,lat+dLat];
}
const targets=picks.map(x=>({...x,bbox:box20Acres(x)}));

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:800}});
await page.route('https://earthlinedevelopment.org/**',async route=>{
  const u=new URL(route.request().url());
  let rel=decodeURIComponent(u.pathname.replace(/^\/+/,''))||'index.html';
  if(rel.endsWith('/'))rel+='index.html';
  const local=resolve(ROOT,rel);
  if(local.startsWith(ROOT)&&existsSync(local)&&statSync(local).isFile()){
    return route.fulfill({status:200,body:readFileSync(local),headers:{'content-type':MIME[extname(local).toLowerCase()]||'application/octet-stream','cache-control':'no-store','x-earthline-v2-preview':'17158'}});
  }
  return route.continue();
});
await page.goto(BASE+'?elderTreeMatrix17158='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});

const result=await page.evaluate(async targets=>{
  const worker=new Worker('/earthline-elder-worker-17129.js',{type:'module'});
  let seq=0;
  const pending=new Map();
  worker.onmessage=e=>{const p=pending.get(e.data?.id);if(p){pending.delete(e.data.id);p.resolve(e.data)}};
  worker.onerror=e=>{for(const p of pending.values())p.reject(new Error(String(e.message||'worker error')));pending.clear()};
  const ask=(payload,timeout=180000)=>new Promise((resolve,reject)=>{
    const id='m'+(++seq);pending.set(id,{resolve,reject});worker.postMessage({...payload,id});
    setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(new Error('timeout '+id))}},timeout);
  });
  const warm=await ask({warm:true},180000);
  const runs=[];
  for(const t of targets){
    const r=await ask({bbox:t.bbox,options:{displayPerTile:24,maxPerTile:240}},180000);
    const tiles=r.result?.earthline?.tile_results||[];
    const valid=tiles.filter(x=>String(x?.status||'').toUpperCase()==='OK');
    const forestAreaHa=valid.reduce((n,x)=>n+Number(x?.forest_area_ha||0),0);
    const forestCells=valid.reduce((n,x)=>n+Number(x?.forest_cells||0),0);
    runs.push({
      target:t,ok:r.ok,error:r.error||null,
      pool:Number(r.result?.earthline?.candidate_pool_count||0),
      display:Number(r.result?.earthline?.display_count||r.result?.features?.length||0),
      forestAreaHa,forestCells,
      modeled:(r.result?.features||[]).filter(f=>String(f?.properties?.source_class||'').toUpperCase()==='MODELED_CHMV2').length,
      scienceBaselines:[...new Set((r.result?.features||[]).map(f=>String(f?.properties?.science_baseline||'')).filter(Boolean))]
    });
  }
  worker.terminate();
  return {warm,runs};
},targets);

const failures=[];
for(const r of result.runs){
  const treeCovered=r.forestCells>0||r.forestAreaHa>0;
  if(!r.ok)failures.push(r.target.name+': worker failure '+r.error);
  if(!treeCovered)failures.push(r.target.name+': known-tree control lost CHMv2 tree cover');
  if(treeCovered&&(r.pool<=0||r.display<=0||r.modeled<=0))failures.push(r.target.name+': tree-covered Property returned no modeled Elder candidate');
  if(treeCovered&&!r.scienceBaselines.includes('17118'))failures.push(r.target.name+': modeled Elder science provenance missing');
}
console.log('EARTHLINE_V2_TREE_COVERED_ELDER_MATRIX_17158 '+JSON.stringify({result,failures}));
await browser.close();
if(failures.length)throw new Error('Tree-covered Property Elder rule failed: '+JSON.stringify(failures));
