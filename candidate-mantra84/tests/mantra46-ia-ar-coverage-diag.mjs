import { chromium } from 'playwright';
const BASE='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
for(const query of ['Iowa','Arkansas']){
 const context=await browser.newContext({viewport:{width:1600,height:900}});
 const page=await context.newPage(); let err=null;
 try{
  await page.goto(BASE+'?m46_cov='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
  await page.waitForFunction(q=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''))&&String(window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784?.query||'').toLowerCase().includes(q.toLowerCase()),query,{timeout:45000,polling:100});
  await page.waitForTimeout(500);
 }catch(e){err=String(e);}
 const d=err?{}:await page.evaluate(()=>({
  terrain:window.EARTHLINE_TERRAIN_GAP_REFINEMENT_16730||null,
  covRefine:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,
  covAudit:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,
  fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,
  perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null
 }));
 console.log('EARTHLINE_M46_COV_DIAG '+JSON.stringify({query,err,d}));
 await context.close();
}
await browser.close();
