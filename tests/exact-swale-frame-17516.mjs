import { chromium } from 'playwright';
import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8');
const browser=await chromium.launch({headless:true});
const sites=[
  {name:'A',lat:44.06957,lng:-72.27369},
  {name:'C',lat:44.07102,lng:-72.27681}
];
function distPointSegM(p,a,b){
  const lat0=(p[1]+a[1]+b[1])/3*Math.PI/180,kx=111320*Math.cos(lat0),ky=110540;
  const px=p[0]*kx,py=p[1]*ky,ax=a[0]*kx,ay=a[1]*ky,bx=b[0]*kx,by=b[1]*ky,dx=bx-ax,dy=by-ay;
  const q=dx*dx+dy*dy?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy))):0;
  return Math.hypot(px-(ax+q*dx),py-(ay+q*dy));
}
for(const site of sites){
 const context=await browser.newContext();
 await context.route('**/*',async r=>{
   const u=new URL(r.request().url());
   if(r.request().resourceType()==='document'&&/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname==='/')
     return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
   return r.continue();
 });
 const page=await context.newPage({viewport:{width:1800,height:950}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('https://earthlinedevelopment.org/?exactSwale17516='+site.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 await page.locator('#searchInput').fill('Vermont');await page.waitForTimeout(750);
 const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible'); if(!await opts.count())throw new Error('no Vermont suggestion');
 await opts.first().click();await page.waitForTimeout(300);
 const rb=page.locator('#runBtn'); if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
 await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
 await page.evaluate(async s=>{
   const o=window.earthlineSelectedSiteFromCenter(M?.loc||null,s.lng,s.lat,20);
   if(!await window.applyLocation(o,null,M.searchGen,{analyzeNow:false,preserveMapView:false}))throw new Error('applyLocation rejected');
   await new Promise(r=>setTimeout(r,500));
   window.earthlineSetPropertyTarget16201({lng:s.lng,lat:s.lat,source:'exact-swale-17516',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
 },site);
 const pre=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
 await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());
 await page.waitForFunction(p=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>p&&a?.settled===true},pre,{timeout:120000,polling:100});
 await page.waitForTimeout(700);
 const out=await page.evaluate(site=>{
   const safe=M?.authoritativeSafeSwales15815?.features||[];
   const d=M?.coverageDiagnostic15803||null;
   function centroid(f){const cs=f?.geometry?.coordinates||[];let x=0,y=0,n=0;for(const p of cs){if(Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1])){x+=+p[0];y+=+p[1];n++}}return n?[x/n,y/n]:null}
   function pointSeg(p,a,b){const lat0=(p[1]+a[1]+b[1])/3*Math.PI/180,kx=111320*Math.cos(lat0),ky=110540;const px=p[0]*kx,py=p[1]*ky,ax=a[0]*kx,ay=a[1]*ky,bx=b[0]*kx,by=b[1]*ky,dx=bx-ax,dy=by-ay,q=dx*dx+dy*dy?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy))):0;return Math.hypot(px-(ax+q*dx),py-(ay+q*dy))}
   let nearest=Infinity,within40=0,within70=0,within100=0;
   const quadrants={NW:0,NE:0,SW:0,SE:0};
   for(const f of safe){
     const cs=f?.geometry?.coordinates||[];let fd=Infinity;
     for(let i=1;i<cs.length;i++)fd=Math.min(fd,pointSeg([site.lng,site.lat],cs[i-1],cs[i]));
     nearest=Math.min(nearest,fd); if(fd<=40)within40++; if(fd<=70)within70++; if(fd<=100)within100++;
     const c=centroid(f); if(c){quadrants[(c[1]>=site.lat?'N':'S')+(c[0]>=site.lng?'E':'W')]++}
   }
   const zones=(d?.zones||[]).map(z=>({id:z.id,safeCells:z.safeCells,contourCells:z.contourCells,seeds:z.seeds,traces:z.traces,segments:z.segments,candidates:z.candidates,accepted:z.accepted,rejections:z.rejections||null}));
   return {
     safeCount:safe.length,nearestSwaleM:Number.isFinite(nearest)?nearest:null,within40,within70,within100,quadrants,
     spacing:M?.spacingStats||null,
     coverage:{
       contourZones:zones.filter(z=>z.contourCells>0).length,
       candidateZones:zones.filter(z=>z.candidates>0).length,
       acceptedZones:zones.filter(z=>z.accepted>0).length,
       blankContour:zones.filter(z=>z.contourCells>0&&z.candidates===0).map(z=>z.id),
       candidateBlank:zones.filter(z=>z.candidates>0&&z.accepted===0).map(z=>z.id),
       zones
     },
     run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
     safety:M?.safetyAudit15806||null
   };
 },site);
 console.log('EARTHLINE_EXACT_SWALE_17516 '+JSON.stringify({site,...out,errors}));
 await context.close();
}
await browser.close();
