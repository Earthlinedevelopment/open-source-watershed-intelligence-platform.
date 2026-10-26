import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('artifacts/mantra78-regional-owner',{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/google-chrome'});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
let error=null,timeout=false;const started=Date.now();
try{
  await page.goto('https://earthlinedevelopment.org/?m78_regional_owner='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForTimeout(1800);
  const input=page.locator('#searchInput');
  await input.click();await input.fill('Arizona');await page.waitForTimeout(900);
  const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').first();
  if(await opt.count())await opt.click();
  await page.waitForTimeout(200);
  await page.locator('#runBtn').click();
  try{
    await page.waitForFunction(()=>{
      const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;if(e)return true;
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
      return !!d&&String(d.tier||d.mode||'').toLowerCase()==='regional'&&/screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;
    },{timeout:60000,polling:100});
  }catch(_){timeout=true;}
  await page.waitForTimeout(3500);
}catch(e){error=String(e&&e.stack||e)}
const snap=await page.evaluate(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const last=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
  const ctx=window.EARTHLINE_REGIONAL_CONTEXT_16198||null;
  const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
  const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
  const ledger=(window.EARTHLINE_RUN_LEDGER_16147||[]).slice(-80);
  const pubs=ledger.filter(x=>x&&['core_run_published','context_enriched','context_enriched_cached_property_preserved'].includes(x.event));
  return {
    query:document.getElementById('searchInput')?.value||'',
    displayed:d,last,ctx,perf,err,
    displayedToken:d?.runToken||null,lastToken:last?.runToken||null,contextToken:ctx?.runToken||null,
    displayedTier:String(d&&(d.tier||d.mode)||'').toLowerCase(),
    documentTier:String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase(),
    runState:String(document.documentElement.dataset.earthlineRunState||''),
    orbRunning:document.documentElement.classList.contains('earthline-regional-running-16233'),
    publications:pubs,
    ledger
  };
});
const coherent=!!snap.displayedToken&&snap.displayedTier==='regional'&&snap.documentTier==='regional'&&!snap.err&&
  (!snap.lastToken||snap.lastToken===snap.displayedToken)&&(!snap.contextToken||snap.contextToken===snap.displayedToken)&&
  snap.publications.every(x=>!x.runToken||x.runToken===snap.displayedToken)&&!snap.orbRunning;
const out={elapsedMs:Date.now()-started,error,timeout,pageErrors,coherent,snap};
console.log('EARTHLINE_M78_REGIONAL_OWNER '+JSON.stringify(out));
writeFileSync('artifacts/mantra78-regional-owner/result.json',JSON.stringify(out,null,2));
await browser.close();
if(error||timeout||pageErrors.length||!coherent)process.exitCode=1;
