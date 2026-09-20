import { chromium } from 'playwright';
import fs from 'node:fs';
const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'Alaska|Hawaii').split('|').filter(Boolean);
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.goto(URL+'?diag16716='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(const stateName of STATES){
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },stateName);
  await page.waitForTimeout(14000);
  const snap=await page.evaluate(q=>{
    const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
    const land=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null;
    const gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
    const product=window.EARTHLINE_TERRAIN_PRODUCTS_AUDIT_16157||null;
    const pre=window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
    const vis=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    return {q,pkg,land,gen,product,pre,boundary,perf,err,visualSwales:vis?.swales?.features?.length??null};
  },stateName);
  rows.push({state:stateName,snap});
}
await browser.close();
const out={at:new Date().toISOString(),rows};
fs.writeFileSync(process.env.OUT||'lab/16716-alaska-hawaii.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out));
