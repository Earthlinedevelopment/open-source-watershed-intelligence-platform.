import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1800,height:950}});
const page=await context.newPage();
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE+'?searchStateCountry17450='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
const ls=()=>page.evaluate(()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])));
const snap=async label=>({
  label,
  input:await page.locator('#searchInput').inputValue(),
  options:await page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').evaluateAll(els=>els.map(el=>({
    text:String(el.textContent||'').replace(/\s+/g,' ').trim(),
    html:el.outerHTML.slice(0,1200),
    dataset:{...el.dataset}
  }))).catch(()=>[]),
  localStorage:await ls()
});
const before=await snap('before');
await page.locator('#searchInput').fill('Vermont');
await page.waitForTimeout(1200);
const typed=await snap('typed');
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count())await opts.first().click();
const selected=await snap('selected');
const rb=page.locator('#runBtn'); if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
await page.waitForTimeout(400);
const published=await page.evaluate(()=>({
  input:document.getElementById('searchInput')?.value||'',
  live:window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null,
  statePkg:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,
  countryPkg:window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845||null
}));
await page.locator('#searchInput').fill('');
await page.locator('#searchInput').focus();
await page.waitForTimeout(500);
const emptyAfter=await snap('emptyAfter');
const result={before,typed,selected,published,emptyAfter,errors};
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/vermont-state-country-17450.json',JSON.stringify(result,null,2));
console.log('EARTHLINE_VERMONT_STATE_COUNTRY_17450 '+JSON.stringify(result));
await browser.close();
