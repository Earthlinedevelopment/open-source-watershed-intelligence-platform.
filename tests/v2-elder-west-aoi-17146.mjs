import { chromium } from 'playwright';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const BASE='https://earthlinedevelopment.org/';
const ROOT=process.cwd();
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.py':'text/plain; charset=utf-8'};
const centers=[
  {name:'positive-control-screenshot',lat:37.41924,lng:-119.30853},
  {name:'west-moved-screenshot',lat:37.41948,lng:-119.31250}
];
function box20Acres({lat,lng}){
  const side=Math.sqrt(20*4046.8564224), half=side/2;
  const dLat=half/111320;
  const dLng=half/(111320*Math.cos(lat*Math.PI/180));
  return [lng-dLng,lat-dLat,lng+dLng,lat+dLat];
}
const targets=centers.map(c=>({...c,bbox:box20Acres(c)}));

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1280,height:800}});
const page=await context.newPage();
await page.route('https://earthlinedevelopment.org/**', async route=>{
  const u=new URL(route.request().url());
  let rel=decodeURIComponent(u.pathname.replace(/^\/+/,'')) || 'index.html';
  if(rel.endsWith('/')) rel+='index.html';
  const local=resolve(ROOT,rel);
  if(local.startsWith(ROOT)&&existsSync(local)&&statSync(local).isFile()){
    return route.fulfill({status:200,body:readFileSync(local),headers:{'content-type':MIME[extname(local).toLowerCase()]||'application/octet-stream','cache-control':'no-store','x-earthline-v2-preview':'17146'}});
  }
  return route.continue();
});
await page.goto(BASE+'?elderWest17146='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
const result=await page.evaluate(async (targets)=>{
  const worker=new Worker('/earthline-elder-worker-17129.js',{type:'module'});
  let seq=0;
  const pending=new Map();
  worker.onmessage=e=>{const p=pending.get(e.data?.id);if(p){pending.delete(e.data.id);p.resolve(e.data)}};
  worker.onerror=e=>{for(const p of pending.values())p.reject(new Error(String(e.message||'worker error')));pending.clear()};
  const ask=(payload,timeout=180000)=>new Promise((resolve,reject)=>{
    const id='t'+(++seq); pending.set(id,{resolve,reject});
    worker.postMessage({...payload,id});
    setTimeout(()=>{if(pending.has(id)){pending.delete(id);reject(new Error('worker timeout '+id))}},timeout);
  });
  const warm=await ask({warm:true},180000);
  const runs=[];
  for(const t of targets){
    const r=await ask({bbox:t.bbox,options:{displayPerTile:24,maxPerTile:240}},180000);
    runs.push({target:t,ok:r.ok,error:r.error||null,earthline:r.result?.earthline||null,featureCount:r.result?.features?.length||0,candidatePoolCount:r.result?.candidatePool?.length||0});
  }
  worker.terminate();
  return {warm,runs};
},targets);
console.log('EARTHLINE_ELDER_WEST_AOI_17146 '+JSON.stringify(result));
await browser.close();

let failed=false;
for(const r of result.runs){
  if(!r.ok){failed=true; console.error('ELDER_WORKER_FAILED '+r.target.name+' '+r.error);}
  if(r.candidatePoolCount<=0){failed=true; console.error('ELDER_ZERO_CANDIDATE_POOL '+r.target.name+' '+JSON.stringify(r.earthline));}
}
if(failed)process.exit(1);
