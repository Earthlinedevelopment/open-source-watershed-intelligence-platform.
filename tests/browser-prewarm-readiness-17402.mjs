import { chromium, firefox, webkit } from 'playwright';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
await page.goto(BASE+'?prewarm17402='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Vermont');
await page.waitForTimeout(600);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click();
const run=page.locator('#runBtn');
if(await run.isVisible()){
  const busy=await run.evaluate(b=>b.dataset.busy==='1'||b.disabled);
  if(!busy)await run.click();
}
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:90000,polling:100});
const out=await page.evaluate(async()=>{
  const api=window.EARTHLINE_ELDER_TREES_V1_17097;
  const before=api?.warmStateForTest17402?.()||null;
  const t0=performance.now();
  const ok=await api?.prewarmForTest17402?.();
  const waitMs=Math.round(performance.now()-t0);
  const after=api?.warmStateForTest17402?.()||null;
  const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
  return {ok,waitMs,before,after,coreMs:perf?.totalMs??null};
});
out.pass=out.ok===true&&out.after?.warmed===true&&out.waitMs<=2000&&Number(out.coreMs)<=15000;
console.log('EARTHLINE_PREWARM_17402 '+JSON.stringify({browser:BROWSER,...out}));
await browser.close();
if(!out.pass)process.exitCode=1;
