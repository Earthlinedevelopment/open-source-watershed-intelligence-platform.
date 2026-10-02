import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const URL='https://earthlinedevelopment.org/';
page.on('console',m=>{if(/Earthline|regional|property|stale|search/i.test(m.text()))console.log('BROWSER',m.text())});
await page.goto(URL+'?handoff='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
async function search(q){
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},q);
}
await search('england country');
await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_TERMINAL_16539?.status==='published',null,{timeout:180000,polling:250});
await page.waitForTimeout(1200);
await page.evaluate(()=>{
 const b=document.getElementById('earthlineDeclareProperty16169')||[...document.querySelectorAll('button')].find(e=>/20\s*acres|analyze/i.test(String(e.textContent||'')));
 if(b)b.click();
});
await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:60000,polling:200}).catch(()=>{});
await page.waitForTimeout(1200);
const before=await page.evaluate(()=>({
 searchGen:Number(M?.searchGen||0),
 displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
 propertyAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
 regionalTerminal:window.EARTHLINE_REGIONAL_TERMINAL_16539||null,
 propertyState:document.documentElement.dataset.earthlinePropertyRunState||'',
 runState:document.documentElement.dataset.earthlineRunState||'',
 propertyDecl:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
 target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
 clearAudit:window.EARTHLINE_PROPERTY_TO_REGIONAL_CLEAR_AUDIT_16334||null
}));
console.log('BEFORE_RETURN '+JSON.stringify(before));
await search('ireland country');
await page.waitForTimeout(20000);
const after=await page.evaluate(()=>({
 search:String(document.getElementById('searchInput')?.value||''),
 searchGen:Number(M?.searchGen||0),
 displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
 propertyAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
 regionalTerminal:window.EARTHLINE_REGIONAL_TERMINAL_16539||null,
 lastRegional:window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null,
 lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
 propertyState:document.documentElement.dataset.earthlinePropertyRunState||'',
 runState:document.documentElement.dataset.earthlineRunState||'',
 propertyDecl:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
 target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
 clearAudit:window.EARTHLINE_PROPERTY_TO_REGIONAL_CLEAR_AUDIT_16334||null,
 regionalActive:window.earthlineRegional15778||null
}));
console.log('AFTER_RETURN '+JSON.stringify(after));
await browser.close();
// trigger live return diagnostic
