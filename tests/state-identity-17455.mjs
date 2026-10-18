import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1600,height:900}});
const page=await context.newPage();
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE+'?stateIdentity17455='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
async function storageHits(){
  return await page.evaluate(()=>{
    const out={};
    for(let i=0;i<localStorage.length;i++){
      const k=localStorage.key(i),v=localStorage.getItem(k)||'';
      if(/vermont|country|recent|search|history/i.test(k+' '+v))out[k]=v.slice(0,1200);
    }
    return out;
  });
}
async function options(){
  return await page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').evaluateAll(els=>els.map(el=>({
    text:String(el.textContent||'').replace(/\s+/g,' ').trim(),
    title:el.getAttribute('title'),
    aria:el.getAttribute('aria-label'),
    value:el.getAttribute('data-value'),
    type:el.getAttribute('data-type'),
    kind:el.getAttribute('data-kind'),
    dataset:{...el.dataset}
  }))).catch(()=>[]);
}
const beforeStorage=await storageHits();
await page.locator('#searchInput').fill('Vermont');
await page.waitForTimeout(1000);
const typedOptions=await options();
const first=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').first();
if(await first.count())await first.click();
const selectedValue=await page.locator('#searchInput').inputValue();
const selectedStorage=await storageHits();
const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
await page.waitForTimeout(300);
const identity=await page.evaluate(()=>({
  input:document.getElementById('searchInput')?.value||'',
  live:window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null,
  statePkg:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,
  countryPkg:window.EARTHLINE_ACTIVE_COUNTRY_PACKAGE_16845||null
}));
const afterStorage=await storageHits();
await page.locator('#searchInput').fill('');
await page.locator('#searchInput').focus();
await page.waitForTimeout(500);
const emptyOptions=await options();
const result={beforeStorage,typedOptions,selectedValue,selectedStorage,identity,afterStorage,emptyOptions,errors};
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/state-identity-17455.json',JSON.stringify(result,null,2));
console.log('EARTHLINE_STATE_IDENTITY_17455 '+JSON.stringify(result));
await browser.close();
