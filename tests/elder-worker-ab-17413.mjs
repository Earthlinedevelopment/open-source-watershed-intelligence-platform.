import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const oldWorker=readFileSync('/tmp/elder-worker-pre17413.js','utf8').replace('await py.loadPackage(["numpy","scipy"]);','await py.loadPackage(["numpy"]);');
const newWorker=readFileSync('earthline-elder-worker-17129.js','utf8').replace('await py.loadPackage(["numpy","scipy"]);','await py.loadPackage(["numpy"]);');
const detector=readFileSync('tools/elder_trees/chmv2_array_detector_17129.py','utf8');
const cases=[['Vermont',-72.5754,44.2601],['California',-121.49,38.58],['Colorado',-105.27,39.73],['Thailand',98.98,18.79],['Laos',102.63,17.97],['Vietnam',105.78,10.03]];
function bbox20(lng,lat){const area=20*4046.8564224,w=Math.sqrt(area*1.15),h=area/w,dlat=h/(2*111320),dlng=w/(2*111320*Math.max(.05,Math.cos(lat*Math.PI/180)));return[lng-dlng,lat-dlat,lng+dlng,lat+dlat]}
const payload=cases.map(([n,x,y])=>[n,bbox20(x,y)]);
const hash=v=>createHash('sha256').update(JSON.stringify(v)).digest('hex');
const canon=f=>({g:f?.geometry||null,p:f?.properties||null});

const browser=await chromium.launch({headless:true});
async function run(worker,label){
  const context=await browser.newContext();
  await context.route('https://earthlinedevelopment.org/earthline-elder-worker-17129.js*',r=>r.fulfill({status:200,body:worker,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}}));
  await context.route('https://earthlinedevelopment.org/tools/elder_trees/chmv2_array_detector_17129.py*',r=>r.fulfill({status:200,body:detector,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}}));
  const page=await context.newPage();
  await page.goto('https://earthlinedevelopment.org/?workerAB17413='+label+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  const result=await page.evaluate(async rows=>{
    const w=new Worker('earthline-elder-worker-17129.js',{type:'module'});let seq=0;
    const ask=(payload,timeout=45000)=>new Promise(resolve=>{
      const id='w'+(++seq)+'-'+Date.now(),timer=setTimeout(()=>resolve({ok:false,error:'timeout'}),timeout);
      const h=e=>{if(e.data?.id!==id)return;w.removeEventListener('message',h);clearTimeout(timer);resolve(e.data)};
      w.addEventListener('message',h);w.postMessage({id,...payload});
    });
    await ask({warm:true},45000);
    const out=[];
    for(const [name,bbox] of rows){
      const r=await ask({bbox,options:{displayPerTile:24,maxPerTile:240}},45000);
      out.push({name,ok:r?.ok===true,error:r?.error||null,pool:r?.result?.candidatePool||[],display:r?.result?.features||[],timing:r?.result?.earthline?.worker_timings_ms||null});
    }
    w.terminate();return out;
  },payload);
  await context.close();return result;
}
const a=await run(oldWorker,'old'), b=await run(newWorker,'new');
await browser.close();
const rows=a.map(x=>{
  const y=b.find(q=>q.name===x.name);
  const ap=(x.pool||[]).map(canon),bp=(y?.pool||[]).map(canon),ad=(x.display||[]).map(canon),bd=(y?.display||[]).map(canon);
  const r={name:x.name,oldOk:x.ok,newOk:y?.ok===true,poolCount:[ap.length,bp.length],displayCount:[ad.length,bd.length],poolHash:[hash(ap),hash(bp)],displayHash:[hash(ad),hash(bd)],oldTiming:x.timing,newTiming:y?.timing||null};
  r.pass=r.oldOk&&r.newOk&&r.poolHash[0]===r.poolHash[1]&&r.displayHash[0]===r.displayHash[1];return r;
});
const summary={pass:rows.every(r=>r.pass),rows};
console.log('EARTHLINE_WORKER_AB_17413 '+JSON.stringify(summary));
if(!summary.pass)process.exitCode=1;
