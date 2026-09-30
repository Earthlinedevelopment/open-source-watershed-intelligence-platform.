import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const OUT='artifacts/mantra50-alaska'; mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?m50ak='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Alaska';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;
try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;return /screening published\./i.test(s)||!!e;},null,{timeout:50000,polling:100});}catch(_){timedOut=true;}
const data=await page.evaluate(()=>{
 const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,b=v?.bounds||null;
 const mids=[];
 for(const f of v?.swales?.features||[]){const c=f?.geometry?.coordinates||[];if(!c.length)continue;const p=c[Math.floor((c.length-1)/2)];if(Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]))mids.push([+p[0],+p[1]]);}
 const occ=[];
 if(b&&b.length===4){const set=new Set();for(const p of mids){const x=Math.max(0,Math.min(5,Math.floor((p[0]-b[0])/Math.max(1e-9,b[2]-b[0])*6))),y=Math.max(0,Math.min(5,Math.floor((p[1]-b[1])/Math.max(1e-9,b[3]-b[1])*6)));set.add(x+','+y);}occ.push(...[...set].sort());}
 return {
  status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''),
  extent:window.EARTHLINE_REGIONAL_EXTENT_AUDIT_16718||window.EARTHLINE_REGIONAL_EXTENT_AUDIT_16717||window.EARTHLINE_REGIONAL_EXTENT_AUDIT_16716||null,
  package:window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,
  coverage:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,
  spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,
  spatial:window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null,
  fine:window.EARTHLINE_FINE_DISPERSION_REBALANCE_16778||null,
  capacity:window.EARTHLINE_SUPPORTED_CAPACITY_16843||null,
  generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
  land:window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null,
  publication:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
  display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,
  bounds:b,selectedMidpoints:mids,selected6x6:occ,
  lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
 };
});
await page.screenshot({path:OUT+'/alaska.png',fullPage:true});
writeFileSync(OUT+'/alaska.json',JSON.stringify({timedOut,errors,data},null,2));
console.log(JSON.stringify({timedOut,errors,summary:{bounds:data.bounds,selected6x6:data.selected6x6,capacity:data.capacity,generation:data.generation,spread:data.spread,coverage:data.coverage,lastError:data.lastError}},null,2));
await browser.close();
if(timedOut||errors.length||data.lastError)process.exitCode=1;
