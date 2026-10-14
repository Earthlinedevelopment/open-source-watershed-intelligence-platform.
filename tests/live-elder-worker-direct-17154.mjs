import { chromium } from 'playwright';

const BASE='https://earthlinedevelopment.org/';
const centers=[
  {name:'east-positive',lat:37.41924,lng:-119.30853},
  {name:'west-moved',lat:37.41948,lng:-119.31250}
];
function box20Acres({lat,lng}){
  const side=Math.sqrt(20*4046.8564224),half=side/2;
  const dLat=half/111320;
  const dLng=half/(111320*Math.cos(lat*Math.PI/180));
  return [lng-dLng,lat-dLat,lng+dLng,lat+dLat];
}
const targets=centers.map(c=>({...c,bbox:box20Acres(c)}));

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:800}});
await page.goto(BASE+'?worker17154='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
const result=await page.evaluate(async targets=>{
  const worker=new Worker('/earthline-elder-worker-17129.js?live17154='+Date.now(),{type:'module'});
  let seq=0;
  const pending=new Map();
  worker.onmessage=e=>{
    const p=pending.get(e.data?.id);
    if(!p)return;
    pending.delete(e.data.id);
    p.resolve(e.data);
  };
  worker.onerror=e=>{
    for(const p of pending.values())p.reject(new Error(String(e.message||'worker error')));
    pending.clear();
  };
  const ask=(payload,timeout=180000)=>new Promise((resolve,reject)=>{
    const id='q'+(++seq);
    pending.set(id,{resolve,reject});
    worker.postMessage({...payload,id});
    setTimeout(()=>{
      if(pending.has(id)){
        pending.delete(id);
        reject(new Error('worker timeout '+id));
      }
    },timeout);
  });

  let warm=null,warmError=null;
  try{warm=await ask({warm:true},180000)}catch(e){warmError=String(e?.stack||e)}
  const runs=[];
  for(const t of targets){
    try{
      const r=await ask({bbox:t.bbox,options:{displayPerTile:24,maxPerTile:240}},180000);
      runs.push({
        target:t,ok:r.ok,error:r.error||null,
        displayCount:r.result?.features?.length||0,
        poolCount:r.result?.candidatePool?.length||0,
        earthline:r.result?.earthline||null
      });
    }catch(e){
      runs.push({target:t,ok:false,error:String(e?.stack||e),displayCount:0,poolCount:0,earthline:null});
    }
  }
  worker.terminate();
  return {warm,warmError,runs};
},targets);

console.log('EARTHLINE_LIVE_ELDER_WORKER_17154 '+JSON.stringify(result));
await browser.close();

if(result.warmError)throw new Error('Live Elder worker warm failed: '+result.warmError);
for(const r of result.runs){
  if(!r.ok)throw new Error(r.target.name+' worker failed: '+r.error);
  if(r.poolCount<=0||r.displayCount<=0)throw new Error(r.target.name+' worker returned zero: '+JSON.stringify(r));
}
