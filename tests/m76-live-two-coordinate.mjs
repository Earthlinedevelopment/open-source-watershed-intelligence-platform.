import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
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
 await page.route('https://api.mapbox.com/**',async route=>{
   const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
   await route.continue({headers});
 });
 await page.goto(BASE+'?m76-live-regression='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>((typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap)&&typeof M!=='undefined',{timeout:30000});
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
   const fc=M?.authoritativeSafeSwales15815||{features:[]}; const rawKept=window.__M76_TEST_KEPT||[];
   const usingRaw=!(fc.features&&fc.features.length);
   const sourceRows=usingRaw?rawKept.map((s,i)=>({id:s.id||i,properties:s,geometry:{coordinates:s.pts||[]}})):fc.features;
   const rows=sourceRows.map((f,i)=>{
     const p=f.properties||{},co=f.geometry?.coordinates||[];
     let len=0;
     for(let j=1;j<co.length;j++){
       if(usingRaw)len+=Math.hypot(co[j][0]-co[j-1][0],co[j][1]-co[j-1][1]);
       else{const lat=(co[j][1]+co[j-1][1])/2*Math.PI/180;len+=Math.hypot((co[j][0]-co[j-1][0])*111320*Math.cos(lat),(co[j][1]-co[j-1][1])*111320);}
     }
     const a=co[0],b=co[co.length-1];
     const chord=a&&b?(usingRaw?Math.hypot(b[0]-a[0],b[1]-a[1]):Math.hypot((b[0]-a[0])*111320*Math.cos(((a[1]+b[1])/2)*Math.PI/180),(b[1]-a[1])*111320)):0;
     const dx=a&&b?(b[0]-a[0]):0,dy=a&&b?(b[1]-a[1]):0;
     const heading=a&&b?(Math.atan2(dx,dy)*180/Math.PI+360)%180:null;
     let elevMin=Infinity,elevMax=-Infinity,align=[];
     if(usingRaw){
       for(let j=0;j<co.length;j++){
         const x=Math.max(1,Math.min(GW-2,Math.round(co[j][0]))),y=Math.max(1,Math.min(GH-2,Math.round(co[j][1])));
         const h=Number(M.h[idx(x,y)]); if(Number.isFinite(h)){elevMin=Math.min(elevMin,h);elevMax=Math.max(elevMax,h);}
         if(j>0){
           const mx=(co[j][0]+co[j-1][0])/2,my=(co[j][1]+co[j-1][1])/2;
           const gx=Math.max(1,Math.min(GW-2,Math.round(mx))),gy=Math.max(1,Math.min(GH-2,Math.round(my)));
           const g=typeof gradAt==='function'?gradAt(gx,gy):[0,0],gm=Math.hypot(g[0],g[1]);
           const tx=co[j][0]-co[j-1][0],ty=co[j][1]-co[j-1][1],tm=Math.hypot(tx,ty);
           if(gm>1e-9&&tm>1e-9)align.push(Math.abs((tx*g[0]+ty*g[1])/(tm*gm)));
         }
       }
     }
     align.sort((a,b)=>a-b);
     return {i,id:p.id||f.id||null,placementMode:p.placementMode15836||null,primary:!!p.primaryFlowFirst15836,
       flowScore:Number(p.prescriptionFlowScore15833||0),flowHits:Number(p.flowEvidence15833?.crossingHits||0),seedFlow:Number(p.seedFlowCrossing15833||0),
       crossing:Number(p.seedCrossingGeometry15833||0),bandKey:p.bandKey??null,levelH:p.levelH??null,
       pts:co.length,lenM:+len.toFixed(1),tortuosity:+(len/Math.max(1,chord)).toFixed(3),heading:heading==null?null:+heading.toFixed(1),
       elevRangeM:Number.isFinite(elevMin)&&Number.isFinite(elevMax)?+(elevMax-elevMin).toFixed(3):null,
       medianAlongSlope:align.length?+align[Math.floor(align.length/2)].toFixed(3):null,
       maxAlongSlope:align.length?+Math.max(...align).toFixed(3):null};
   });
   const hashArray=a=>{let h=2166136261>>>0;if(!a)return null;for(let i=0;i<a.length;i++){let v=Number(a[i]);if(!Number.isFinite(v))v=-999999;const q=Math.round(v*1000000);h^=q&255;h=Math.imul(h,16777619)>>>0;h^=(q>>>8)&255;h=Math.imul(h,16777619)>>>0;h^=(q>>>16)&255;h=Math.imul(h,16777619)>>>0;h^=(q>>>24)&255;h=Math.imul(h,16777619)>>>0;}return h.toString(16).padStart(8,'0')};
   const inputFingerprint={GW,GH,cellM:Number(M?.cellM||0),terrainStamp:String(M?.terrainStamp||''),searchGen:Number(M?.searchGen||0),h:hashArray(M?.h),dir:hashArray(M?.dir),acc:hashArray(M?.acc),inP:hashArray(M?.inP),noBuild:hashArray(M?.noBuildMask),pond:hashArray(M?.pond),center:[Number(M?.centerLat||0),Number(M?.centerLng||0)],maskStamp:String(M?._noBuildStamp||'')};
   return {run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173,elder:window.EARTHLINE_ELDER_TREES_AUDIT_17097||window.EARTHLINE_ELDER_TREE_AUDIT_17097||null,inputFingerprint,rawGeometry:rawKept.map(s=>({primary:!!s.primaryFlowFirst15836,pts:(s.pts||[]).map(p=>[+p[0],+p[1]])})),
     count:rows.length,rows,diag:M?.swaleDiagnostics||null,flowFirst:M?.flowFirstAudit15836||M?.swaleFlowFirst15836||null,rawKeptCount:rawKept.length};
 });
 out.push({case:c,...snap});
 await page.screenshot({path:'m76-'+c.name.toLowerCase()+'.png'});
 await ctx.close();
}
await browser.close();
for(const r of out){
 const bad=r.rows.filter(x=>!Number.isFinite(x.tortuosity)||x.tortuosity>1.36);
 if(r.rawKeptCount<1)throw new Error(r.case.name+' no prescriber geometry captured');
 if(bad.length)throw new Error(r.case.name+' geometry guard failed '+JSON.stringify(bad.slice(0,5))); const zeroRunoff=r.rows.filter(x=>!x.primary&&x.flowHits<=0&&x.seedFlow<=0); if(zeroRunoff.length)throw new Error(r.case.name+' zero-runoff secondary swales remain '+JSON.stringify(zeroRunoff.slice(0,5)));
}
fs.writeFileSync('M76-LIVE-TWO-COORD-REPORT.json',JSON.stringify(out,null,2));
for(const r of out){
  const gs=r.rawGeometry||[];
  const all=gs.flatMap(g=>g.pts||[]);
  const minX=Math.min(...all.map(p=>p[0])),maxX=Math.max(...all.map(p=>p[0]));
  const minY=Math.min(...all.map(p=>p[1])),maxY=Math.max(...all.map(p=>p[1]));
  const pad=10,W=900,H=650,sx=(W-2*pad)/Math.max(1,maxX-minX),sy=(H-2*pad)/Math.max(1,maxY-minY),sc=Math.min(sx,sy);
  const tx=x=>pad+(x-minX)*sc,ty=y=>H-pad-(y-minY)*sc;
  const paths=gs.map((g,i)=>'<polyline points="'+g.pts.map(p=>tx(p[0]).toFixed(1)+','+ty(p[1]).toFixed(1)).join(' ')+'" fill="none" stroke="'+(g.primary?'#1f77b4':'#2ca02c')+'" stroke-width="'+(g.primary?3:2)+'" stroke-linecap="round" stroke-linejoin="round"/>').join('\n');
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+W+'" height="'+H+'" viewBox="0 0 '+W+' '+H+'"><rect width="100%" height="100%" fill="white"/><text x="20" y="28" font-family="Arial" font-size="20">'+r.case.name+' '+r.case.lat+','+r.case.lng+' — '+gs.length+' swales</text><g transform="translate(0,20)">'+paths+'</g></svg>';
  fs.writeFileSync('M76-'+r.case.name+'-SWALES.svg',svg);
}
console.log(JSON.stringify(out.map(x=>({case:x.case.name,count:x.count,primary:x.rows.filter(r=>r.primary).length,secondary:x.rows.filter(r=>!r.primary).length,headings:x.rows.map(r=>r.heading)})),null,2));
