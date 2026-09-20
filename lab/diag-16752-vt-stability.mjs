import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.goto('https://earthlinedevelopment.org/?vtstable16752='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
});
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:30000,polling:100}).catch(()=>{});
const rows=[];
for(let k=0;k<25;k++){
  rows.push(await page.evaluate(()=>{
    const map=window.earthlineMap||null;
    const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const vis=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const dr=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const cam=map?.getBounds?.();
    return {
      t:Date.now(),
      swaleLines:d?.swaleLines??null,
      sourceSwales:Array.isArray(vis?.swales?.features)?vis.swales.features.length:null,
      gradeCounts:d?.swaleGradeCounts??null,
      zoom:map?.getZoom?.()??null,
      camera:cam?[cam.getWest(),cam.getSouth(),cam.getEast(),cam.getNorth()]:null,
      displayedRun:dr,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),
      boundary:window.EARTHLINE_VERMONT_PRODUCT_BOUNDARY_AUDIT_16178?.after?.swales??null,
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.totalMs??null
    };
  }));
  await page.waitForTimeout(2000);
}
console.log(JSON.stringify({rows}));
await browser.close();
