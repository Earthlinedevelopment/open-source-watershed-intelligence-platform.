import { firefox } from 'playwright';
import fs from 'node:fs';
const worker=fs.readFileSync('earthline-elder-worker-17129.js','utf8');
const detector=fs.readFileSync('tools/elder_trees/chmv2_array_detector_17129.py','utf8');
const browser=await firefox.launch({headless:true});
const context=await browser.newContext();
await context.route('**/*',async r=>{const u=new URL(r.request().url());
 if(r.request().resourceType()==='document'&&/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname==='/')return r.fulfill({status:200,body:'<!doctype html><meta charset=utf-8>',headers:{'content-type':'text/html'}});
 if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname.endsWith('/earthline-elder-worker-17129.js'))return r.fulfill({status:200,body:worker,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
 if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname.endsWith('/tools/elder_trees/chmv2_array_detector_17129.py'))return r.fulfill({status:200,body:detector,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
 return r.continue();});
const page=await context.newPage();await page.goto('https://earthlinedevelopment.org/?cap17548='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
const sites=[{name:'Firefox-Essex',lng:-72.6916312414004,lat:42.9317591024477}];
function bbox(s){const area=20*4046.8564224,w=Math.sqrt(area*1.15),h=area/w,dLat=h/(2*111320),dLng=w/(2*111320*Math.max(.05,Math.cos(s.lat*Math.PI/180)));return [s.lng-dLng,s.lat-dLat,s.lng+dLng,s.lat+dLat]}
const rows=await page.evaluate(async ({sites,bboxes})=>{
 const hav=(a,b)=>{const R=6371008.8,p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180,dp=(b[1]-a[1])*Math.PI/180,dl=(b[0]-a[0])*Math.PI/180,q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)))};
 const w=new Worker('earthline-elder-worker-17129.js',{type:'module'});
 const ask=(msg,timeout=120000)=>new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error('timeout '+msg.id)),timeout);const fn=e=>{if(e.data?.id!==msg.id)return;clearTimeout(t);w.removeEventListener('message',fn);e.data?.ok?res(e.data.result??e.data):rej(new Error(e.data?.error||'worker failed'))};w.addEventListener('message',fn);w.postMessage(msg)});
 const warm0=performance.now();await ask({id:'warm',warm:true},60000);const warmMs=performance.now()-warm0;
 const out=[];
 for(let k=0;k<sites.length;k++){
   const bb=bboxes[k],runs=[];
   for(const cap of [240,192,160,128,96]){const t0=performance.now();const r=await ask({id:'s'+k+'c'+cap,bbox:bb,options:{displayPerTile:24,maxPerTile:cap}},120000);runs.push({cap,ms:performance.now()-t0,result:r});}
   const base=runs[0];
   const sig=f=>({c:f.geometry.coordinates,conf:Number(f.properties?.elder_tree_confidence_pct||0),cohort:String(f.properties?.elder_cohort||''),height:Number(f.properties?.height_m||0)});
   const baseF=(base.result.features||[]).map(sig);
   const comps=runs.slice(1).map(rr=>{const ff=(rr.result.features||[]).map(sig);let matched=0,maxD=0,confOk=0,cohortOk=0,heightOk=0;const used=new Set();for(const a of baseF){let bi=-1,bd=Infinity;for(let i=0;i<ff.length;i++){if(used.has(i))continue;const d=hav(a.c,ff[i].c);if(d<bd){bd=d;bi=i}}if(bi>=0&&bd<=0.75){used.add(bi);matched++;maxD=Math.max(maxD,bd);if(a.conf===ff[bi].conf)confOk++;if(a.cohort===ff[bi].cohort)cohortOk++;if(Math.abs(a.height-ff[bi].height)<=0.01)heightOk++;}}return {cap:rr.cap,ms:rr.ms,pool:Number(rr.result.earthline?.candidate_pool_count||0),display:ff.length,matched,matchRate:baseF.length?matched/baseF.length:1,maxD,confRate:matched?confOk/matched:1,cohortRate:matched?cohortOk/matched:1,heightRate:matched?heightOk/matched:1,identical:matched===baseF.length&&ff.length===baseF.length&&confOk===matched&&cohortOk===matched&&heightOk===matched};});
   out.push({site:sites[k],warmMs,baseline:{cap:240,ms:base.ms,pool:Number(base.result.earthline?.candidate_pool_count||0),display:baseF.length,timings:base.result.earthline?.worker_timings_ms||null},comps});
 }
 w.terminate();return out;
},{sites,bboxes:sites.map(bbox)});
console.log('EARTHLINE_ELDER_CAP_EQUIV_17548 '+JSON.stringify(rows));
const common=[192,160,128,96].find(cap=>rows.every(r=>r.comps.find(x=>x.cap===cap)?.identical));
console.log('EARTHLINE_ELDER_CAP_EQUIV_17548_SUMMARY '+JSON.stringify({common,rows}));
await context.close();await browser.close();