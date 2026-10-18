import { chromium } from 'playwright';
import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8');
const browser=await chromium.launch({headless:true});
const sites=[{name:'A',lat:44.06957,lng:-72.27369},{name:'B',lat:44.0858,lng:-72.2802}];
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
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('https://earthlinedevelopment.org/?channel17478='+site.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.locator('#searchInput').fill('Vermont');await page.waitForTimeout(700);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(!await opts.count())throw new Error('no Vermont suggestion');
  await opts.first().click();await page.waitForTimeout(250);await page.locator('#runBtn').click();
  await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
  await page.evaluate(async s=>{
    const o=window.earthlineSelectedSiteFromCenter(M?.loc||null,s.lng,s.lat,20);
    if(!await window.applyLocation(o,null,M.searchGen,{analyzeNow:false,preserveMapView:false}))throw new Error('applyLocation rejected');
    await new Promise(r=>setTimeout(r,400));
    window.earthlineSetPropertyTarget16201({lng:s.lng,lat:s.lat,source:'channel17478',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
  },site);
  const pre=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const t0=Date.now();await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());
  await page.waitForFunction(p=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>p&&a?.settled===true},pre,{timeout:120000,polling:100});
  await page.waitForTimeout(500);
  const snap=await page.evaluate(()=>{
    const safe=M?.authoritativeSafeSwales15815?.features||[],d=M?.coverageDiagnostic15803||null;
    const z=(d?.zones||[]).map(x=>({id:x.id,safeCells:x.safeCells,contourCells:x.contourCells,candidates:x.candidates,accepted:x.accepted}));
    return {safeCount:safe.length,spacing:M?.spacingStats||null,
      coverage:{contourZones:z.filter(x=>x.contourCells>0).length,candidateZones:z.filter(x=>x.candidates>0).length,acceptedZones:z.filter(x=>x.accepted>0).length,maxAccepted:z.length?Math.max(...z.map(x=>+x.accepted||0)):0,blankContour:z.filter(x=>x.contourCells>0&&x.candidates===0).map(x=>x.id),candidateBlank:z.filter(x=>x.candidates>0&&x.accepted===0).map(x=>x.id)},
      safety:M?.safetyAudit15806||null,run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null};
  });
  rows.push({site,elapsedMs:Date.now()-t0,...snap,errors});
  console.log('EARTHLINE_CHANNEL_BUFFER_17478 '+JSON.stringify(rows.at(-1)));
  await context.close();
}
await browser.close();
const pass=rows.every(r=>r.safeCount>0&&r.safety?.verified===true&&Number(r.safety?.unsafeCount??r.safety?.unsafe??0)===0);
console.log('EARTHLINE_CHANNEL_BUFFER_17478_SUMMARY '+JSON.stringify({pass,rows:rows.map(r=>({site:r.site,safeCount:r.safeCount,spacing:r.spacing,coverage:r.coverage,elapsedMs:r.elapsedMs}))}));
if(!pass)process.exitCode=1;
