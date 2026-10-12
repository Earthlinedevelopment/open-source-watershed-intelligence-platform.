import { chromium } from 'playwright';
const TARGET=process.env.TARGET;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?realclick17134='+encodeURIComponent(TARGET)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(q=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
},TARGET);
await page.waitForFunction(q=>{
  const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
  return !!e||String(d?.query||'').trim().toLowerCase()===q.trim().toLowerCase();
},TARGET,{timeout:95000,polling:100});
await page.waitForTimeout(700);
const button=page.locator('#earthlineDeclareProperty16169');
await button.waitFor({state:'visible',timeout:10000});
await button.click({timeout:10000});
let waitError=null;
try{
  await page.waitForFunction(()=>{
    const r=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    return !!r||!!p||String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running';
  },{timeout:5000,polling:50});
}catch(e){waitError=String(e?.message||e)}
await page.waitForTimeout(2500);
const out=await page.evaluate(()=>({
  intent:window.EARTHLINE_EXPLICIT_ANALYSIS_INTENT_16325||null,
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  tier:document.documentElement.dataset.earthlineAnalysisTier||'',
  runState:document.documentElement.dataset.earthlinePropertyRunState||'',
  declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
  run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  pub:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
  block:window.EARTHLINE_PROPERTY_PUBLICATION_BLOCK_16176||null,
  status:document.getElementById('earthlineVermontStatus16147')?.textContent||''
}));
console.log('REALCLICK17134 '+JSON.stringify({TARGET,waitError,errors,out}));
await browser.close();
