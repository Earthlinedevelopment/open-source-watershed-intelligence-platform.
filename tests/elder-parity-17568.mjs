import { firefox } from 'playwright';
import fs from 'node:fs';

const browser=await firefox.launch({headless:false});
const context=await browser.newContext({viewport:{width:1600,height:900}});
const index=fs.readFileSync('index.html','utf8');
const pyWorker=fs.readFileSync('tests/earthline-elder-worker-python-17568.js','utf8');
const jsWorker=fs.readFileSync('earthline-elder-worker-17129.js','utf8');
const detector=fs.readFileSync('tools/elder_trees/chmv2_array_detector_17129.py','utf8');

await context.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(r.request().resourceType()==='document'&&/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname==='/')
    return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname.endsWith('/earthline-elder-worker-17129.js'))
    return r.fulfill({status:200,body:jsWorker,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname.endsWith('/earthline-elder-worker-python-17568.js'))
    return r.fulfill({status:200,body:pyWorker,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname.endsWith('/tools/elder_trees/chmv2_array_detector_17129.py'))
    return r.fulfill({status:200,body:detector,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
  return r.continue();
});

const page=await context.newPage();
await page.goto('https://earthlinedevelopment.org/?parity17568='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});

const sites=[
  {name:'Essex',lng:-73.111251,lat:44.53397998171303},
  {name:'Rutland',lng:-73.1,lat:43.60831190199366},
  {name:'A',lng:-72.27369,lat:44.06957},
  {name:'C',lng:-72.27681,lat:44.07102},
];
function bboxFor(site){
  const area=20*4046.8564224,w=Math.sqrt(area*1.15),h=area/w;
  const dLat=h/(2*111320),dLng=w/(2*111320*Math.max(.05,Math.cos(site.lat*Math.PI/180)));
  return [site.lng-dLng,site.lat-dLat,site.lng+dLng,site.lat+dLat];
}

const rows=await page.evaluate(async sites=>{
  const hav=(a,b)=>{const R=6371008.8,p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180,dp=(b[1]-a[1])*Math.PI/180,dl=(b[0]-a[0])*Math.PI/180,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)))};
  const ask=(w,msg,timeout=120000)=>new Promise((resolve,reject)=>{const id=msg.id,t=setTimeout(()=>reject(new Error('timeout '+id)),timeout);const fn=e=>{if(e.data?.id!==id)return;clearTimeout(t);w.removeEventListener('message',fn);e.data?.ok?resolve(e.data):reject(new Error(e.data?.error||'worker failed'))};w.addEventListener('message',fn);w.postMessage(msg)});
  const py=new Worker('earthline-elder-worker-python-17568.js',{type:'module'});
  const js=new Worker('earthline-elder-worker-17129.js',{type:'module'});
  await ask(py,{id:'warm',warm:true},60000);
  const out=[];
  for(const site of sites){
    const p0=performance.now(),pr=await ask(py,{id:'py-'+site.name,bbox:site.bbox,options:{displayPerTile:24,maxPerTile:240}},120000),pyMs=performance.now()-p0;
    const j0=performance.now(),jr=await ask(js,{id:'js-'+site.name,bbox:site.bbox,options:{displayPerTile:24,maxPerTile:240}},120000),jsMs=performance.now()-j0;
    const pf=pr.result?.candidatePool||[],jf=jr.result?.candidatePool||[];
    let matched=0,sum=0,max=0,conf=0,cohort=0,height=0;
    for(const f of pf){
      let best=Infinity,bg=null;
      for(const g of jf){const d=hav(f.geometry.coordinates,g.geometry.coordinates);if(d<best){best=d;bg=g}}
      if(best<=3&&bg){matched++;sum+=best;max=Math.max(max,best);conf+=Math.abs(Number(f.properties?.elder_tree_confidence_pct||0)-Number(bg.properties?.elder_tree_confidence_pct||0));height+=Math.abs(Number(f.properties?.height_m||0)-Number(bg.properties?.height_m||0));if(String(f.properties?.elder_cohort||'')===String(bg.properties?.elder_cohort||''))cohort++}
    }
    out.push({name:site.name,bbox:site.bbox,pyMs,jsMs,pythonPool:pf.length,jsPool:jf.length,pythonDisplay:pr.result?.features?.length||0,jsDisplay:jr.result?.features?.length||0,matchedWithin3m:matched,matchRate:pf.length?matched/pf.length:1,meanDistance:matched?sum/matched:null,maxDistance:matched?max:null,meanConfidenceDiff:matched?conf/matched:null,meanHeightDiff:matched?height/matched:null,cohortMatchRate:matched?cohort/matched:1,pythonTimings:pr.result?.earthline?.worker_timings_ms||null,jsTimings:jr.result?.earthline?.worker_timings_ms||null});
  }
  py.terminate();js.terminate();
  return out;
},sites.map(s=>({...s,bbox:bboxFor(s)})));

let pass=true;
for(const row of rows){
  row.pass=row.pythonPool===row.jsPool&&row.pythonDisplay===row.jsDisplay&&row.matchRate>=0.995&&row.cohortMatchRate>=0.995&&(row.meanConfidenceDiff??0)<=0.01;
  pass&&=row.pass;
  console.log('EARTHLINE_ELDER_PARITY_17568 '+JSON.stringify(row));
}
console.log('EARTHLINE_ELDER_PARITY_FINAL_17568 '+JSON.stringify({pass,rows}));
await context.close();await browser.close();
if(!pass)process.exitCode=1;
