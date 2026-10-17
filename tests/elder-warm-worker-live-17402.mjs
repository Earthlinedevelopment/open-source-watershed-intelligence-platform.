import { chromium, firefox, webkit } from 'playwright';
import { readFileSync } from 'node:fs';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const context=await browser.newContext();
const worker=readFileSync('earthline-elder-worker-17129.js','utf8')
  .replace('await py.loadPackage(["numpy","scipy"]);','await py.loadPackage(["numpy"]); /* 17402 */');
const detector=readFileSync('tools/elder_trees/chmv2_array_detector_17129.py','utf8');
await context.route('https://earthlinedevelopment.org/earthline-elder-worker-17129.js*',r=>r.fulfill({status:200,body:worker,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}}));
await context.route('https://earthlinedevelopment.org/tools/elder_trees/chmv2_array_detector_17129.py*',r=>r.fulfill({status:200,body:detector,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}}));
const page=await context.newPage();
await page.goto('https://earthlinedevelopment.org/?warmWorker17402='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
const cases=[
 ['Vermont',-72.5754,44.2601],['California',-121.49,38.58],['Colorado',-105.27,39.73],
 ['Thailand',98.98,18.79],['Laos',102.63,17.97],['Vietnam',105.78,10.03]
];
function bbox20(lng,lat){const area=20*4046.8564224,w=Math.sqrt(area*1.15),h=area/w,dlat=h/(2*111320),dlng=w/(2*111320*Math.max(.05,Math.cos(lat*Math.PI/180)));return[lng-dlng,lat-dlat,lng+dlng,lat+dlat]}
const result=await page.evaluate(async ({cases,browserName})=>{
  const w=new Worker('earthline-elder-worker-17129.js',{type:'module'});
  let seq=0;
  const ask=(payload,timeout=30000)=>new Promise(resolve=>{
    const id='g'+(++seq)+'-'+Date.now();
    const timer=setTimeout(()=>resolve({ok:false,timeout:true,error:'timeout'}),timeout);
    const handler=e=>{if(e.data?.id!==id)return;w.removeEventListener('message',handler);clearTimeout(timer);resolve(e.data)};
    w.addEventListener('message',handler);w.postMessage({id,...payload});
  });
  const warm0=performance.now(),warm=await ask({warm:true},30000),warmMs=Math.round(performance.now()-warm0);
  const rows=[];
  for(const [name,lng,lat,bbox] of cases){
    const t0=performance.now();const r=await ask({bbox,options:{displayPerTile:24,maxPerTile:240}},30000);
    const elapsedMs=Math.round(performance.now()-t0);
    const tiles=r?.result?.earthline?.tile_results||[];
    const transportOk=tiles.some(t=>t&&t.status!=='NO_TILE');
    rows.push({name,elapsedMs,ok:r?.ok===true,error:r?.error||null,featureCount:r?.result?.features?.length??null,
      candidatePool:r?.result?.earthline?.candidate_pool_count??null,workerTimings:r?.result?.earthline?.worker_timings_ms||null,
      transportOk,pass:r?.ok===true&&transportOk&&elapsedMs<=15000});
  }
  w.terminate();
  return {browser:browserName,warmOk:warm?.ok===true,warmMs,rows};
},{cases:cases.map(([n,x,y])=>[n,x,y,bbox20(x,y)]),browserName:BROWSER});
result.pass=result.warmOk&&result.rows.every(r=>r.pass);
console.log('EARTHLINE_WARM_WORKER_17402 '+JSON.stringify(result));
await browser.close();
if(!result.pass)process.exitCode=1;
