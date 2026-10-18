import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
await page.goto('https://earthlinedevelopment.org/?seedAudit17471='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(async()=>{
  const o=window.earthlineSelectedSiteFromCenter(M?.loc||null,-72.27369,44.06957,20);
  await window.applyLocation(o,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
  await new Promise(r=>setTimeout(r,500));
  window.earthlineSetPropertyTarget16201({lng:-72.27369,lat:44.06957,source:'seed-audit-17471',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
});
const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());
await page.waitForFunction(p=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>p&&a?.settled===true},before,{timeout:120000,polling:100});
const out=await page.evaluate(()=>{
 const d=M?.coverageDiagnostic15803||null;
 return {
   zones:(d?.zones||[]).map(z=>({id:z.id,safe:z.safeCells,contour:z.contourCells,seeds:z.seeds,traces:z.traces,segments:z.segments,candidates:z.candidates,flow:z.flowFirstCandidates,contourGen:z.contourGeneratedCandidates,accepted:z.accepted,rejections:z.rejections})),
   preselection:d?.preselectionFate15841||null,
   termination:d?.termination||null,
   meta:M?.swaleMeta||null
 };
});
console.log('EARTHLINE_SEED_AUDIT_17471 '+JSON.stringify(out));
await browser.close();
