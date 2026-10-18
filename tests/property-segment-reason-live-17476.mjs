import { chromium } from 'playwright';
import fs from 'node:fs';
const index=fs.readFileSync('index.html','utf8');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext();
await context.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(r.request().resourceType()==='document'&&/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname==='/')
    return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  return r.continue();
});
const page=await context.newPage({viewport:{width:1800,height:950}});
await page.goto('https://earthlinedevelopment.org/?segmentReason17476='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Vermont');await page.waitForTimeout(750);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(!await opts.count())throw new Error('no Vermont suggestion');
await opts.first().click();await page.waitForTimeout(300);await page.locator('#runBtn').click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
const site={lat:44.06957,lng:-72.27369};
await page.evaluate(async s=>{
  const o=window.earthlineSelectedSiteFromCenter(M?.loc||null,s.lng,s.lat,20);
  if(!await window.applyLocation(o,null,M.searchGen,{analyzeNow:false,preserveMapView:false}))throw new Error('applyLocation rejected');
  await new Promise(r=>setTimeout(r,500));
  window.earthlineSetPropertyTarget16201({lng:s.lng,lat:s.lat,source:'segment-reason-17476',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
},site);
const pre=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());
await page.waitForFunction(p=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>p&&a?.settled===true},pre,{timeout:120000,polling:100});
const out=await page.evaluate(()=>({audit:window.EARTHLINE_SEGMENT_REASON_AUDIT_17476||null,run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,safeCount:M?.authoritativeSafeSwales15815?.features?.length||0}));
console.log('EARTHLINE_SEGMENT_REASON_17476 '+JSON.stringify(out));
await browser.close();
