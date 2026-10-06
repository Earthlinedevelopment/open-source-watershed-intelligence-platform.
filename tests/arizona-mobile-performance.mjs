import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const page=await context.newPage();
const session=await context.newCDPSession(page);
await session.send('Emulation.setCPUThrottlingRate',{rate:4});
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?az_mobile_perf='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{state:'attached',timeout:25000});
await page.waitForTimeout(1200);
if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
  await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
  await page.waitForTimeout(300);
}
await page.locator('#searchInput').click();
await page.locator('#searchInput').fill('Arizona');
await page.waitForTimeout(900);
const exact=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await exact.count()){try{await exact.tap({timeout:8000});await page.waitForTimeout(350)}catch(_){}}
const before=Date.now();
await page.evaluate(()=>document.getElementById('runBtn')?.click());
try{
  await page.waitForFunction(()=>{
    if(window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970)return true;
    const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
    return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;
  },{timeout:60000,polling:150});
}catch(_){}
await page.waitForTimeout(500);
const out=await page.evaluate(()=>({
  input:document.getElementById('searchInput')?.value||'',
  perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
  err:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
  pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
  flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
  boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
  statePackage:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,
  status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),
  panelOpen:document.documentElement.classList.contains('earthline-panel-open-16188')
}));
out.wallMs=Date.now()-before;
console.log('EARTHLINE_AZ_MOBILE_PERF '+JSON.stringify({out,errs}));
await browser.close();
if(out.err||!/screening published\./i.test(out.status||''))process.exitCode=1;
