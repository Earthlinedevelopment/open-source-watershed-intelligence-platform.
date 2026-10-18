import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE+'?alabamaRegionalElder17450='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{window.__EL17450=[];document.addEventListener('earthline:analysis-complete',e=>window.__EL17450.push({at:Date.now(),tier:String(e?.detail?.tier||e?.detail?.mode||''),elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null}),{passive:true})});
await page.locator('#searchInput').fill('Alabama'); await page.waitForTimeout(700);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible'); if(await opts.count())await opts.first().click();
const t0=Date.now(); const rb=page.locator('#runBtn'); if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
const publishedAt=Date.now();
let elderAt=null;
try{
  await page.waitForFunction(start=>{
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    const at=Date.parse(e?.at||'');
    return e?.state==='committed'&&Number.isFinite(at)&&at>=start-1000;
  },t0,{timeout:30000,polling:100});
  elderAt=Date.now();
}catch(_){elderAt=null}
const state=await page.evaluate(()=>({
  elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
  events:window.__EL17450||[],
  perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
  status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')
}));
const result={regionalWallMs:publishedAt-t0,elderAfterPublishedMs:elderAt==null?null:elderAt-publishedAt,elderFromClickMs:elderAt==null?null:elderAt-t0,state,errors};
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/alabama-regional-elder-17450.json',JSON.stringify(result,null,2));
console.log('EARTHLINE_ALABAMA_REGIONAL_ELDER_17450 '+JSON.stringify(result));
await browser.close();
