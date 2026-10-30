import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';

const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await sleep(1200);
let browser;
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const consoleRows=[];
  page.on('console',m=>consoleRows.push(m.text()));
  await page.goto('http://127.0.0.1:4173/index.html',{waitUntil:'domcontentloaded',timeout:30000});
  const input=page.locator('#searchInput');
  await input.waitFor({state:'visible',timeout:20000});
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
      activeTier:document.documentElement.dataset.earthlineAnalysisTier||null
    };
  });
  console.log(JSON.stringify(audit,null,2));
  if(audit.tier!=='regional') throw new Error('Enter did not publish Regional');
  if(audit.runStarted!==1) throw new Error('Expected exactly one authoritative run_started, got '+audit.runStarted);
  if(audit.regionalOwnerEntered!==1) throw new Error('Expected exactly one Regional owner entry, got '+audit.regionalOwnerEntered);
  await fs.mkdir('artifacts/16847-search-enter',{recursive:true});
  await page.screenshot({path:'artifacts/16847-search-enter/vermont-enter.png',fullPage:true});
} finally {
  if(browser) await browser.close();
  server.kill('SIGTERM');
}
