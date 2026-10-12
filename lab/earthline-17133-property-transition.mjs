import { chromium } from 'playwright';
const TARGET=process.env.TARGET;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?transition17133='+encodeURIComponent(TARGET)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},TARGET);
await page.waitForFunction(q=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;return !!e||String(d?.query||'').trim().toLowerCase()===q.trim().toLowerCase();},TARGET,{timeout:95000,polling:100});
await page.waitForTimeout(500);
const before=await page.evaluate(()=>{
 const b=document.getElementById('earthlineDeclareProperty16169');
 const rect=b?.getBoundingClientRect?.();
 return {
  button: b?{disabled:!!b.disabled,hidden:!!b.hidden,display:getComputedStyle(b).display,visibility:getComputedStyle(b).visibility,text:b.textContent||'',ariaDisabled:b.getAttribute('aria-disabled'),rect:rect?{x:rect.x,y:rect.y,w:rect.width,h:rect.height}:null}:null,
  tier:document.documentElement.dataset.earthlineAnalysisTier||'',
  runState:document.documentElement.dataset.earthlinePropertyRunState||'',
  declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  atomic:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,
  displayed:window.EARTHLINE_DISPLAYED_RUN_16151||null,
  regional:window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null,
  location:window.M?.loc||null
 };
});
let clickError=null;
try{await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');if(!b)throw new Error('button missing');b.click();});}catch(e){clickError=String(e)}
await page.waitForTimeout(3000);
const after=await page.evaluate(()=>({
 tier:document.documentElement.dataset.earthlineAnalysisTier||'',
 runState:document.documentElement.dataset.earthlinePropertyRunState||'',
 declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
 target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
 launchAudit:window.EARTHLINE_PROPERTY_LAUNCH_AUDIT_16322||null,
 run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
 pub:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
 status:document.getElementById('earthlineVermontStatus16147')?.textContent||'',
 notice:window.EARTHLINE_LAST_NOTICE||null
}));
console.log('TRANSITION17133 '+JSON.stringify({TARGET,clickError,errors,before,after}));
await browser.close();