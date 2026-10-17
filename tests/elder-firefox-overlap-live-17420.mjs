import { firefox } from 'playwright';
import { readFileSync } from 'node:fs';
const browser=await firefox.launch({headless:false});
const context=await browser.newContext();
const worker=readFileSync('earthline-elder-worker-17129.js','utf8');
const detector=readFileSync('tools/elder_trees/chmv2_array_detector_17129.py','utf8');
await context.route('https://earthlinedevelopment.org/earthline-elder-worker-17129.js*',r=>r.fulfill({status:200,body:worker,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}}));
await context.route('https://earthlinedevelopment.org/tools/elder_trees/chmv2_array_detector_17129.py*',r=>r.fulfill({status:200,body:detector,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}}));
const page=await context.newPage();
await page.goto('https://earthlinedevelopment.org/?elderOverlap17420='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
const result=await page.evaluate(async()=>{
  const area=20*4046.8564224,w=Math.sqrt(area*1.15),h=area/w;
  const bbox=(lng,lat)=>{const dlat=h/(2*111320),dlng=w/(2*111320*Math.max(.05,Math.cos(lat*Math.PI/180)));return[lng-dlng,lat-dlat,lng+dlng,lat+dlat]};
  const worker=new Worker('earthline-elder-worker-17129.js',{type:'module'});
  let seq=0;
  const ask=(payload,timeout=45000)=>new Promise(resolve=>{
    const id='o'+(++seq)+'-'+Date.now();
    const timer=setTimeout(()=>resolve({ok:false,timeout:true,error:'timeout'}),timeout);
    const handler=e=>{if(e.data?.id!==id)return;worker.removeEventListener('message',handler);clearTimeout(timer);resolve(e.data)};
    worker.addEventListener('message',handler);worker.postMessage({id,...payload});
  });
  const warmStart=performance.now();
  const warmPromise=ask({warm:true},45000);
  await new Promise(r=>setTimeout(r,10000));
  const detectStart=performance.now();
  const detection=await ask({bbox:bbox(-105.27,39.73),options:{displayPerTile:24,maxPerTile:240}},45000);
  const detectElapsedMs=Math.round(performance.now()-detectStart);
  const warm=await warmPromise;
  const warmTotalMs=Math.round(performance.now()-warmStart);
  worker.terminate();
  const tiles=detection?.result?.earthline?.tile_results||[];
  const transportOk=tiles.some(t=>t&&t.status!=='NO_TILE');
  return {warmOk:warm?.ok===true,warmElapsedMs:warm?.elapsedMs??null,warmTotalMs,detectElapsedMs,
    detectOk:detection?.ok===true,transportOk,featureCount:detection?.result?.features?.length??null,
    candidatePool:detection?.result?.earthline?.candidate_pool_count??null,
    workerTimings:detection?.result?.earthline?.worker_timings_ms||null,tileResults:tiles};
});
result.pass=result.warmOk&&result.detectOk&&result.transportOk&&result.detectElapsedMs<=15000&&Number(result.candidatePool)>0;
console.log('EARTHLINE_FIREFOX_ELDER_OVERLAP_17420 '+JSON.stringify(result));
await browser.close();
if(!result.pass)process.exitCode=1;
