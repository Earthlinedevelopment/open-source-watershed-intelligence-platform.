import { chromium, firefox, webkit } from 'playwright';
import { readFileSync } from 'node:fs';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const BASE='https://earthlinedevelopment.org/';
const worker=readFileSync('earthline-elder-worker-17129.js','utf8')
  .replace('await py.loadPackage(["numpy","scipy"]);','await py.loadPackage(["numpy"]); /* 17398 live-origin speed candidate */');
const detector=readFileSync('tools/elder_trees/chmv2_array_detector_17129.py','utf8');

const cases=[
  {name:'Vermont',lng:-72.5754,lat:44.2601},
  {name:'California',lng:-121.49,lat:38.58},
  {name:'Colorado',lng:-105.27,lat:39.73},
  {name:'Thailand',lng:98.98,lat:18.79},
  {name:'Laos',lng:102.63,lat:17.97},
  {name:'Vietnam',lng:105.78,lat:10.03}
];

function bbox20(lng,lat){
  const areaM2=20*4046.8564224,wM=Math.sqrt(areaM2*1.15),hM=areaM2/wM;
  const dLat=hM/(2*111320),dLng=wM/(2*111320*Math.max(.05,Math.cos(lat*Math.PI/180)));
  return [lng-dLng,lat-dLat,lng+dLng,lat+dLat];
}

const rows=[];
for(const c of cases){
  const context=await browser.newContext();
  await context.route('https://earthlinedevelopment.org/earthline-elder-worker-17129.js*',route=>route.fulfill({
    status:200,body:worker,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}
  }));
  await context.route('https://earthlinedevelopment.org/tools/elder_trees/chmv2_array_detector_17129.py*',route=>route.fulfill({
    status:200,body:detector,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}
  }));
  const page=await context.newPage();
  await page.goto(BASE+'?elderLive17398='+encodeURIComponent(c.name)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  const bbox=bbox20(c.lng,c.lat);
  const row=await page.evaluate(async ({bbox,name,browserName})=>{
    const t0=performance.now();
    const out=await new Promise(resolve=>{
      const w=new Worker('earthline-elder-worker-17129.js',{type:'module'});
      const id='live-'+Date.now()+'-'+Math.random().toString(36).slice(2);
      const timer=setTimeout(()=>{try{w.terminate()}catch(_){};resolve({ok:false,timeout:true,error:'timeout'});},25000);
      w.onmessage=e=>{
        if(e.data?.id!==id)return;
        clearTimeout(timer);
        const data=e.data;
        try{w.terminate()}catch(_){}
        resolve({ok:data?.ok===true,timeout:false,error:data?.error||null,result:data?.result||null});
      };
      w.onerror=e=>{
        clearTimeout(timer);try{w.terminate()}catch(_){}
        resolve({ok:false,timeout:false,error:String(e?.message||'worker error')});
      };
      w.postMessage({id,bbox,options:{displayPerTile:24,maxPerTile:240}});
    });
    return {
      browser:browserName,name,elapsedMs:Math.round(performance.now()-t0),
      ok:out.ok,timeout:out.timeout,error:out.error,
      featureCount:out.result?.features?.length??null,
      candidatePool:out.result?.earthline?.candidate_pool_count??null,
      workerTimings:out.result?.earthline?.worker_timings_ms||null,
      tileResults:out.result?.earthline?.tile_results||null
    };
  },{bbox,name:c.name,browserName:BROWSER});
  const tiles=Array.isArray(row.tileResults)?row.tileResults:[];
  const transportOk=tiles.length>0&&tiles.some(t=>t&&t.status!=='NO_TILE');
  row.pass=row.ok===true&&!row.timeout&&row.elapsedMs<=15000&&transportOk;
  rows.push(row);
  console.log('EARTHLINE_ELDER_LIVE_17398 '+JSON.stringify({...row,transportOk,pass:row.pass}));
  await context.close();
}
await browser.close();
const summary={browser:BROWSER,total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,rows};
console.log('EARTHLINE_ELDER_LIVE_17398_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
