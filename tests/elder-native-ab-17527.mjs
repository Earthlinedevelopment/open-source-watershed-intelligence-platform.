import { chromium } from 'playwright';
import fs from 'node:fs';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
const sites=[{name:'Essex',lng:-72.6916312414004,lat:42.9317591024477},{name:'Rutland',lng:-73.1,lat:43.60831190199366}];
function bbox(s){const area=20*4046.8564224,w=Math.sqrt(area*1.15),h=area/w,dLat=h/(2*111320),dLng=w/(2*111320*Math.max(.05,Math.cos(s.lat*Math.PI/180)));return [s.lng-dLng,s.lat-dLat,s.lng+dLng,s.lat+dLat]}
await page.goto('http://127.0.0.1:8787/?ab17527='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
const rows=await page.evaluate(async ({sites,bboxes})=>{
  const hav=(a,b)=>{const R=6371008.8,p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180,dp=(b[1]-a[1])*Math.PI/180,dl=(b[0]-a[0])*Math.PI/180,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)))};
  const make=url=>new Worker(url,{type:'module'});
  const ask=(w,msg,timeout=120000)=>new Promise((resolve,reject)=>{const id=msg.id,t=setTimeout(()=>reject(new Error('timeout '+id)),timeout);const fn=e=>{if(e.data?.id!==id)return;clearTimeout(t);w.removeEventListener('message',fn);e.data?.ok?resolve(e.data):reject(new Error(e.data?.error||'worker failed'))};w.addEventListener('message',fn);w.postMessage(msg)});
  const py=make('earthline-elder-worker-17129.js'),js=make('earthline-elder-worker-js-17527.js');
  await ask(py,{id:'warm',warm:true},60000);
  const out=[];
  for(let k=0;k<sites.length;k++){
    const bb=bboxes[k];
    const [a,b]=await Promise.all([
      ask(py,{id:'py'+k,bbox:bb,options:{displayPerTile:24,maxPerTile:240}},120000),
      ask(js,{id:'js'+k,bbox:bb,options:{displayPerTile:24,maxPerTile:240}},120000)
    ]);
    const pf=a.result?.candidatePool||[],jf=b.result?.candidatePool||[];
    let matched=0,sumD=0,maxD=0,confDiff=0,cohortMatch=0;
    for(const f of pf){
      const p=f.geometry.coordinates;let best=Infinity,bg=null;
      for(const g of jf){const d=hav(p,g.geometry.coordinates);if(d<best){best=d;bg=g}}
      if(best<=3){matched++;sumD+=best;maxD=Math.max(maxD,best);confDiff+=Math.abs(Number(f.properties?.elder_tree_confidence_pct||0)-Number(bg?.properties?.elder_tree_confidence_pct||0));if(String(f.properties?.elder_cohort||'')===String(bg?.properties?.elder_cohort||''))cohortMatch++}
    }
    const pc={};for(const f of pf){const c=String(f.properties?.elder_cohort||'');pc[c]=(pc[c]||0)+1}
    const jc={};for(const f of jf){const c=String(f.properties?.elder_cohort||'');jc[c]=(jc[c]||0)+1}
    out.push({site:sites[k],bbox:bb,pythonPool:pf.length,jsPool:jf.length,pythonDisplay:a.result?.features?.length||0,jsDisplay:b.result?.features?.length||0,
      matchedWithin3m:matched,matchRate:pf.length?matched/pf.length:1,meanMatchedDistanceM:matched?sumD/matched:null,maxMatchedDistanceM:matched?maxD:null,
      meanConfidenceDiff:matched?confDiff/matched:null,cohortMatchRate:matched?cohortMatch/matched:null,pythonCohorts:pc,jsCohorts:jc,
      pythonMs:a.result?.earthline?.worker_timings_ms||null,jsMs:b.result?.earthline?.worker_timings_ms||null});
  }
  py.terminate();js.terminate();return out;
},{sites,bboxes:sites.map(bbox)});
console.log('EARTHLINE_ELDER_AB_17527 '+JSON.stringify(rows));
await browser.close();
