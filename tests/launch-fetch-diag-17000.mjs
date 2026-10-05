import { chromium } from 'playwright';

const pageErrors=[];
const failed=[];
const bad=[];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1600,height:900}});
const page=await context.newPage();
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('requestfailed',r=>failed.push({url:r.url(),method:r.method(),failure:r.failure()}));
page.on('response',r=>{if(r.status()>=400)bad.push({url:r.url(),status:r.status()});});

await page.goto('https://earthlinedevelopment.org/?launch_fetch_diag_17000='+Date.now(),{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForSelector('#searchInput',{timeout:15000});
await page.evaluate(()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.focus();i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
});
await page.waitForTimeout(12000);
const state=await page.evaluate(()=>({
  err:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
  perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
  status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
}));
console.log('EARTHLINE_FETCH_DIAG '+JSON.stringify({state,pageErrors,failed,bad}));
await browser.close();
