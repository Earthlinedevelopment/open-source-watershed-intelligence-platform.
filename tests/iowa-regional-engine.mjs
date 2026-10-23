import { chromium } from 'playwright';
import fs from 'node:fs';

const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('https://api.mapbox.com/**',async route=>{
  const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
  await route.continue({headers});
});
const started=Date.now();
await page.goto('http://127.0.0.1:8787/?iowa-regional-engine='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});
const input=page.locator('#searchInput');
await input.fill('Iowa');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(200);
await page.locator('#runBtn').click({force:true});
let settled=false;
try{
  await page.waitForFunction(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const tier=String(d&&(d.tier||d.mode)||'').toLowerCase();
    return tier==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
  },null,{timeout:120000,polling:250});
  settled=true;
}catch(_){}
await page.waitForTimeout(1500);
const diag=await page.evaluate(()=>({
  displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
  swaleMeta:(typeof M!=='undefined'&&M.swaleMeta)||null,
  swaleDiagnostics:(typeof M!=='undefined'&&M.swaleDiagnostics)||null,
  coverage:(typeof M!=='undefined'&&M.coverageDiagnostic15803)||null,
  regional:(typeof M!=='undefined'&&M.regionalOpportunityModel)||null,
  runAudit:window.EARTHLINE_REGIONAL_RUN_AUDIT||null,
  busy:document.getElementById('runBtn')?.getAttribute('aria-busy')||null
}));
diag.settled=settled;diag.elapsedMs=Date.now()-started;
fs.writeFileSync('iowa-regional-engine.json',JSON.stringify(diag,null,2));
await page.screenshot({path:'iowa-regional-engine.png',fullPage:false});
console.log('EARTHLINE_IOWA_REGIONAL_ENGINE '+JSON.stringify(diag));
await browser.close();