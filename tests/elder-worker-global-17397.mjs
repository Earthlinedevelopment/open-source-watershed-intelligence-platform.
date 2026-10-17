import { chromium, firefox, webkit } from 'playwright';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';

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
  const page=await context.newPage();
  await page.goto(BASE+'?elderWorker17397='+encodeURIComponent(c.name)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  const bbox=bbox20(c.lng,c.lat);
  const row=await page.evaluate(async ({bbox,name,browserName})=>{
    const t0=performance.now();
    const out=await new Promise(resolve=>{
      const w=new Worker('earthline-elder-worker-17129.js',{type:'module'});
      const id='gate-'+Date.now()+'-'+Math.random().toString(36).slice(2);
      const timer=setTimeout(()=>{try{w.terminate()}catch(_){};resolve({ok:false,timeout:true,error:'timeout'});},20000);
      w.onmessage=e=>{
        if(e.data?.id!==id)return;
        clearTimeout(timer);
        const data=e.data;
        try{w.terminate()}catch(_){}
        resolve({ok:data?.ok===true,timeout:false,error:data?.error||null,result:data?.result||null});
      };
      w.onerror=e=>{
        clearTimeout(timer);
        try{w.terminate()}catch(_){}
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
  row.pass=row.ok===true&&!row.timeout&&row.elapsedMs<=15000;
  rows.push(row);
  console.log('EARTHLINE_ELDER_WORKER_17397 '+JSON.stringify(row));
  await context.close();
}
await browser.close();
const summary={browser:BROWSER,total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,rows};
console.log('EARTHLINE_ELDER_WORKER_17397_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
