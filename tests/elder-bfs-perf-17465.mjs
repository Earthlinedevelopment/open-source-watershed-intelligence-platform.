import { firefox } from 'playwright';
import { readFileSync } from 'node:fs';

const worker=readFileSync('earthline-elder-worker-17129.js','utf8');
const baseline=readFileSync('/tmp/elder-baseline-17454.py','utf8');
const candidate=readFileSync('tools/elder_trees/chmv2_array_detector_17129.py','utf8');
const bbox=[-72.5770,44.2588,-72.5738,44.2614];

async function run(label,detector){
  const browser=await firefox.launch({headless:true});
  const context=await browser.newContext();
  await context.route('https://earthlinedevelopment.org/earthline-elder-worker-17129.js*',r=>r.fulfill({status:200,body:worker,headers:{'content-type':'text/javascript','cache-control':'no-store'}}));
  await context.route('https://earthlinedevelopment.org/tools/elder_trees/chmv2_array_detector_17129.py*',r=>r.fulfill({status:200,body:detector,headers:{'content-type':'text/plain','cache-control':'no-store'}}));
  const page=await context.newPage();
  await page.goto('https://earthlinedevelopment.org/?elderPerf17465='+label+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  const out=await page.evaluate(async bbox=>{
    const w=new Worker('earthline-elder-worker-17129.js',{type:'module'});let seq=0;
    const ask=(payload,timeout=45000)=>new Promise(resolve=>{const id='p'+(++seq);const tm=setTimeout(()=>resolve({ok:false,error:'timeout'}),timeout);const h=e=>{if(e.data?.id!==id)return;w.removeEventListener('message',h);clearTimeout(tm);resolve(e.data)};w.addEventListener('message',h);w.postMessage({id,...payload});});
    const t0=performance.now();const warm=await ask({warm:true});const warmMs=performance.now()-t0;
    const rows=[];
    for(let i=0;i<2;i++){const a=performance.now();const r=await ask({bbox,options:{displayPerTile:24,maxPerTile:240}});rows.push({elapsedMs:performance.now()-a,ok:r?.ok===true,count:r?.result?.earthline?.candidate_pool_count??null,timings:r?.result?.earthline?.worker_timings_ms??null});}
    w.terminate();return {warmMs,warmOk:warm?.ok===true,rows};
  },bbox);
  await context.close();await browser.close();return out;
}
const b=await run('baseline',baseline);
const c=await run('candidate',candidate);
console.log('EARTHLINE_ELDER_BFS_PERF_17465 '+JSON.stringify({baseline:b,candidate:c}));
