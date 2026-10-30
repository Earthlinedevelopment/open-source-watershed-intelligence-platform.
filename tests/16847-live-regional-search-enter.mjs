import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const TARGET='https://earthlinedevelopment.org/';
let browser;
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto(TARGET,{waitUntil:'domcontentloaded',timeout:45000});
  const input=page.locator('#searchInput');
  await input.waitFor({state:'visible',timeout:25000});
  await input.fill('Vermont');
  await input.press('Enter');
  await page.waitForFunction(()=>{
    const d=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;
    return !!(d && String(d.query||'').toLowerCase().includes('vermont') &&
      String(d.tier||d.mode||'').toLowerCase()==='regional');
  },null,{timeout:45000});
  const audit=await page.evaluate(()=>{
    const d=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
    const ledger=window.EARTHLINE_RUN_LEDGER_16147||window.EARTHLINE_RUN_LEDGER_16149||[];
    return {
      query:d&&d.query||null,
      tier:d&&(d.tier||d.mode)||null,
      runToken:d&&d.runToken||null,
      runStarted:ledger.filter(x=>x&&x.event==='run_started').length,
      regionalOwnerEntered:ledger.filter(x=>x&&x.event==='analysis_bounds_locked').length,
      runState:document.documentElement.dataset.earthlineRunState||null,
      activeTier:document.documentElement.dataset.earthlineAnalysisTier||null,
      build:window.EARTHLINE_BUILD||null
    };
  });
  console.log(JSON.stringify(audit,null,2));
  if(audit.tier!=='regional') throw new Error('Live Enter did not publish Regional');
  if(audit.runStarted!==1) throw new Error('Expected exactly one live run_started, got '+audit.runStarted);
  if(audit.regionalOwnerEntered!==1) throw new Error('Expected exactly one live Regional owner entry, got '+audit.regionalOwnerEntered);
  await fs.mkdir('artifacts/16847-live-search-enter',{recursive:true});
  await page.screenshot({path:'artifacts/16847-live-search-enter/vermont-live-enter.png',fullPage:true});
} finally {
  if(browser) await browser.close();
}
