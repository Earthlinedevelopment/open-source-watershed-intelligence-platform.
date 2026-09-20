import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.goto('https://earthlinedevelopment.org/?vtpub16751='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  window.EARTHLINE_REGIONAL_PERFORMANCE_16191=null;
  window.EARTHLINE_VERMONT_PRODUCT_BOUNDARY_AUDIT_16178=null;
  window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167=null;
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
});
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:30000,polling:100}).catch(()=>{});
await page.waitForTimeout(1500);
const out=await page.evaluate(()=>{
 const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
 const boundary=window.EARTHLINE_VERMONT_PRODUCT_BOUNDARY_AUDIT_16178||null;
 const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
 const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
 const vis=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
 return {
   perf,boundary,pub,disp,
   visualSwales:Array.isArray(vis?.swales?.features)?vis.swales.features.length:null,
   preselection:window.EARTHLINE_VERMONT_PRESELECTION_BOUNDARY_16747||null,
   spatial:window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null,
   coverage:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,
   source:window.EARTHLINE_VERMONT_BOUNDARY_SOURCE_16178||null,
   status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),
   error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
 };
});
console.log(JSON.stringify(out));
await browser.close();
