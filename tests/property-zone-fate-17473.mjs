import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?zoneFate17473='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Vermont');await page.waitForTimeout(750);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(!await opts.count())throw new Error('no Vermont suggestion');
await opts.first().click();await page.waitForTimeout(300);
const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
const site={lat:44.06957,lng:-72.27369};
await page.evaluate(async s=>{
  const siteObj=window.earthlineSelectedSiteFromCenter(M?.loc||null,s.lng,s.lat,20);
  const applied=await window.applyLocation(siteObj,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
  if(!applied)throw new Error('applyLocation rejected');
  await new Promise(r=>setTimeout(r,500));
  window.earthlineSetPropertyTarget16201({lng:s.lng,lat:s.lat,source:'zone-fate-17473',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
},site);
const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());
await page.waitForFunction(pre=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>pre&&a?.settled===true},before,{timeout:120000,polling:100});
await page.waitForTimeout(500);
const out=await page.evaluate(()=>{
 const d=M?.coverageDiagnostic15803||null;
 const zoneOf=(s)=>s?.zone||null;
 const byZone={};
 for(const z of d?.zones||[])byZone[z.id]={id:z.id,safeCells:z.safeCells,contourCells:z.contourCells,seeds:z.seeds,traces:z.traces,segments:z.segments,candidates:z.candidates,accepted:z.accepted,rejections:z.rejections,fates:{}};
 for(const s of d?.spatial?.seeds||[]){
   const zid=zoneOf(s); if(!zid||!byZone[zid])continue;
   const key=(s.terminalStage15840||s.status||'unknown')+'|'+(s.terminalReasonCode15840||'');
   byZone[zid].fates[key]=(byZone[zid].fates[key]||0)+1;
 }
 return {zones:Object.values(byZone),seedFateSummary:d?.seedFateSummary15840||null,preselection:d?.preselectionFate15841?.summary||null,
  totals:d?.totals||null,termination:d?.termination||null,run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,errors:[]};
});
out.errors=errors;
console.log('EARTHLINE_ZONE_FATE_17473 '+JSON.stringify(out));
await browser.close();
