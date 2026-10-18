import { chromium } from 'playwright';
import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8');
const browser=await chromium.launch({headless:true});
const sites=[
  {name:'A',lat:44.06957,lng:-72.27369,maxNearest:15,minWithin40:5,minCount:100,maxQuadrantShare:.48},
  {name:'C',lat:44.07102,lng:-72.27681,maxNearest:15,minWithin40:5,minCount:120,maxQuadrantShare:.36}
];
const rows=[];
for(const site of sites){
 const context=await browser.newContext();
 await context.route('**/*',async r=>{
   const u=new URL(r.request().url());
   if(r.request().resourceType()==='document'&&/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname==='/')
     return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
   return r.continue();
 });
 const page=await context.newPage({viewport:{width:1800,height:950}});
 await page.goto('https://earthlinedevelopment.org/?screenshotSwaleGate17516='+site.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 await page.locator('#searchInput').fill('Vermont');await page.waitForTimeout(750);
 const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(!await opts.count())throw new Error('no Vermont suggestion');
 await opts.first().click();await page.waitForTimeout(300);
 const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
 await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
 await page.evaluate(async s=>{
   const o=window.earthlineSelectedSiteFromCenter(M?.loc||null,s.lng,s.lat,20);
   if(!await window.applyLocation(o,null,M.searchGen,{analyzeNow:false,preserveMapView:false}))throw new Error('applyLocation rejected');
   await new Promise(r=>setTimeout(r,500));
   window.earthlineSetPropertyTarget16201({lng:s.lng,lat:s.lat,source:'screenshot-swale-gate-17516',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
 },site);
 const pre=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
 await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());
 await page.waitForFunction(p=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>p&&a?.settled===true},pre,{timeout:120000,polling:100});
 await page.waitForTimeout(500);
 const out=await page.evaluate(site=>{
   const safe=M?.authoritativeSafeSwales15815?.features||[];
   function centroid(f){const cs=f?.geometry?.coordinates||[];let x=0,y=0,n=0;for(const p of cs){if(Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1])){x+=+p[0];y+=+p[1];n++}}return n?[x/n,y/n]:null}
   function pointSeg(p,a,b){const lat0=(p[1]+a[1]+b[1])/3*Math.PI/180,kx=111320*Math.cos(lat0),ky=110540;const px=p[0]*kx,py=p[1]*ky,ax=a[0]*kx,ay=a[1]*ky,bx=b[0]*kx,by=b[1]*ky,dx=bx-ax,dy=by-ay,q=dx*dx+dy*dy?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy))):0;return Math.hypot(px-(ax+q*dx),py-(ay+q*dy))}
   let nearest=Infinity,within40=0;const quadrants={NW:0,NE:0,SW:0,SE:0};
   for(const f of safe){const cs=f?.geometry?.coordinates||[];let fd=Infinity;for(let i=1;i<cs.length;i++)fd=Math.min(fd,pointSeg([site.lng,site.lat],cs[i-1],cs[i]));nearest=Math.min(nearest,fd);if(fd<=40)within40++;const c=centroid(f);if(c)quadrants[(c[1]>=site.lat?'N':'S')+(c[0]>=site.lng?'E':'W')]++}
   return {safeCount:safe.length,nearestSwaleM:nearest,within40,quadrants,run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null};
 },site);
 const maxQ=Math.max(...Object.values(out.quadrants))/(out.safeCount||1);
 const pass=out.run?.result===true&&out.safeCount>=site.minCount&&out.nearestSwaleM<=site.maxNearest&&out.within40>=site.minWithin40&&maxQ<=site.maxQuadrantShare;
 rows.push({site,out,maxQuadrantShare:maxQ,pass});
 console.log('EARTHLINE_SCREENSHOT_SWALE_GATE_17516 '+JSON.stringify(rows.at(-1)));
 await context.close();
}
await browser.close();
const pass=rows.every(r=>r.pass);
console.log('EARTHLINE_SCREENSHOT_SWALE_GATE_17516_SUMMARY '+JSON.stringify({pass,rows}));
if(!pass)process.exitCode=1;
