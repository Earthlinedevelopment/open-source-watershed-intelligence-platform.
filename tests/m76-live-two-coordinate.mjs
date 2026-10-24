import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE='https://live.earthlinedevelopment.org/';
const CASES=[
 {name:'GOOD',lat:34.21607,lng:-111.93178},
 {name:'BAD',lat:34.21605,lng:-111.93582}
];
const browser=await chromium.launch({headless:true});
const out=[];
for(const c of CASES){
 const ctx=await browser.newContext({viewport:{width:1800,height:900}});
 const page=await ctx.newPage();
 page.on('pageerror',e=>console.log('PAGEERR',c.name,String(e)));
 await page.goto(BASE+'?m76-live-regression='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>window.earthlineMap&&typeof M!=='undefined',{timeout:30000});
 await page.evaluate(({lat,lng})=>{
   const q=lat.toFixed(5)+', '+lng.toFixed(5);
   M.loc={name:'Arizona',fullName:q,query:q,sub:'M76 live regression',area:'20 acres',countryCode:'us',placeType:'point',lat,lng};
   M.centerLat=lat;M.centerLng=lng;M.appliedSearchText=q;
   const i=document.getElementById('searchInput');if(i)i.value='Arizona';
   window.EARTHLINE_PROPERTY_TARGET_16201={lat,lng,source:'m76-live-regression',at:new Date().toISOString()};
   if(window.earthlineRegional15778){window.earthlineRegional15778.active=false;window.earthlineRegional15778.mode='focus';}
   earthlineMap.stop?.();earthlineMap.jumpTo?.({center:[lng,lat],zoom:18});
 },c);
 const res=await page.evaluate(async()=>{
   const fn=window.earthlineDeclarePropertyAtCrosshair16173||window.earthlineDeclarePropertyAtCrosshair16169;
   if(typeof fn!=='function')return {error:'no property owner'};
   try{return {result:await Promise.resolve(fn())}}catch(e){return {error:String(e?.message||e)}}
 });
 if(res.error)throw new Error(c.name+' '+res.error);
 await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running',{timeout:90000,polling:200});
 await page.waitForTimeout(2500);
 const snap=await page.evaluate(()=>{
   const fc=M?.authoritativeSafeSwales15815||{features:[]};
   const rows=(fc.features||[]).map((f,i)=>{
     const p=f.properties||{},co=f.geometry?.coordinates||[];
     let len=0;
     for(let j=1;j<co.length;j++){
       const lat=(co[j][1]+co[j-1][1])/2*Math.PI/180;
       len+=Math.hypot((co[j][0]-co[j-1][0])*111320*Math.cos(lat),(co[j][1]-co[j-1][1])*111320);
     }
     const a=co[0],b=co[co.length-1];
     const chord=a&&b?Math.hypot((b[0]-a[0])*111320*Math.cos(((a[1]+b[1])/2)*Math.PI/180),(b[1]-a[1])*111320):0;
     const dx=a&&b?(b[0]-a[0])*Math.cos(((a[1]+b[1])/2)*Math.PI/180):0,dy=a&&b?(b[1]-a[1]):0;
     const heading=a&&b?(Math.atan2(dx,dy)*180/Math.PI+360)%180:null;
     return {i,id:p.id||f.id||null,placementMode:p.placementMode15836||null,primary:!!p.primaryFlowFirst15836,
       flowScore:Number(p.prescriptionFlowScore15833||0),seedFlow:Number(p.seedFlowCrossing15833||0),
       crossing:Number(p.seedCrossingGeometry15833||0),bandKey:p.bandKey??null,levelH:p.levelH??null,
       pts:co.length,lenM:+len.toFixed(1),tortuosity:+(len/Math.max(1,chord)).toFixed(3),heading:heading==null?null:+heading.toFixed(1)};
   });
   return {run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173,elder:window.EARTHLINE_ELDER_TREES_AUDIT_17097||window.EARTHLINE_ELDER_TREE_AUDIT_17097||null,
     count:rows.length,rows,diag:M?.swaleDiagnostics||null,flowFirst:M?.flowFirstAudit15836||M?.swaleFlowFirst15836||null};
 });
 out.push({case:c,...snap});
 await page.screenshot({path:'m76-'+c.name.toLowerCase()+'.png'});
 await ctx.close();
}
await browser.close();
fs.writeFileSync('M76-LIVE-TWO-COORD-REPORT.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out.map(x=>({case:x.case.name,count:x.count,primary:x.rows.filter(r=>r.primary).length,secondary:x.rows.filter(r=>!r.primary).length,headings:x.rows.map(r=>r.heading)})),null,2));
