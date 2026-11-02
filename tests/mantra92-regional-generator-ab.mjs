import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const html=readFileSync('artifacts/mantra92/yield-ab/index.html','utf8');
mkdirSync('artifacts/mantra92/yield-ab/results',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:950}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.route('**/*',route=>{
 const r=route.request();
 if(r.isNavigationRequest()&&r.resourceType()==='document'&&r.url().startsWith(BASE))
   return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
 return route.continue();
});
await page.goto(BASE+'?m92alaska_publish='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:15000});
await page.evaluate(()=>{
 const e=document.getElementById('searchInput');e.value='Alaska';
 e.dispatchEvent(new Event('input',{bubbles:true}));
 e.dispatchEvent(new Event('change',{bubbles:true}));
 document.getElementById('runBtn').click();
});
await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
 !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:90000,polling:200});
const snap=await page.evaluate(()=>{
 const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{},
  disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||
       window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||{},
  perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{};
 const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
 const src=map?.getSource?.('el-live-swales-15970');
 const features=src?._data?.features||src?.serialize?.()?.data?.features||[];
 const dist=(a,b)=>{
   const rad=Math.PI/180,R=6371008.8,p1=Number(a[1])*rad,p2=Number(b[1])*rad,
   dp=(Number(b[1])-Number(a[1]))*rad,dl=(Number(b[0])-Number(a[0]))*rad;
   const h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
   return 2*R*Math.asin(Math.min(1,Math.sqrt(h)));
 };
 function cropped(coords,cap=2000){
   if(!Array.isArray(coords)||coords.length<3)return coords;
   const mid=Math.floor((coords.length-1)/2);
   let left=mid,right=mid,leftD=0,rightD=0;
   while(left>0){
     const d=dist(coords[left],coords[left-1]);
     if(!Number.isFinite(d)||leftD+d>cap)break;
     left--;leftD+=d;
   }
   while(right<coords.length-1){
     const d=dist(coords[right],coords[right+1]);
     if(!Number.isFinite(d)||rightD+d>cap)break;
     right++;rightD+=d;
   }
   if(left===right){if(right<coords.length-1)right++;else if(left>0)left--;}
   return coords.slice(left,right+1);
 }
 const lengths=[];
 for(let i=0;i<features.length;i++){
   const coords=features[i].geometry?.coordinates||[];
   const croppedCoords=cropped(coords);
   let px=0,projectError=null;
   try{
     for(let k=1;k<croppedCoords.length;k++){
       const a=map.project(croppedCoords[k-1]),b=map.project(croppedCoords[k]);
       px+=Math.hypot(b.x-a.x,b.y-a.y);
     }
   }catch(e){projectError=String(e);px=NaN;}
   const physical=coords.reduce((n,b,k)=>n+(k?dist(coords[k-1],b):0),0);
   lengths.push({i,coordinateCount:coords.length,croppedCount:croppedCoords?.length||0,
     pxLength:px,metres:physical,projectError,
     sample:coords.length?coords[Math.floor(coords.length/2)]:null,
     properties:{grade:features[i].properties?.grade,score:features[i].properties?.score}});
 }
 lengths.sort((a,b)=>(a.pxLength??Infinity)-(b.pxLength??Infinity));
 return {perf:perf.phaseTotalsMs||{},pub,display:disp,
  map:{zoom:map?.getZoom?.(),bounds:map?.getBounds?.()?.toArray?.(),center:map?.getCenter?.()},
  count:features.length,shortest:lengths.slice(0,14),below01:lengths.filter(x=>x.pxLength<0.1),
  no2:lengths.filter(x=>x.croppedCount<2),sourceErrors:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
});
const result={snap,errors};
console.log('M92_ALASKA_DISPLAY_DIAG '+JSON.stringify(result));
writeFileSync('artifacts/mantra92/yield-ab/results/alaska-display.json',JSON.stringify(result,null,2));
await page.screenshot({path:'artifacts/mantra92/yield-ab/results/alaska-display.png'});
await browser.close();
if(errors.length||snap.sourceErrors)process.exitCode=1;
