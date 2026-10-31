import {chromium,devices} from 'playwright';

const CASES=[
  ['iPhone 13','Vermont'],
  ['iPhone 13','Arizona'],
  ['Pixel 7','Vermont'],
  ['Pixel 7','Arizona']
];

const browser=await chromium.launch({headless:true});
const results=[];
for(const [deviceName,q] of CASES){
  const device=devices[deviceName];
  const context=await browser.newContext({...device});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  const started=Date.now();
  let outcome={device:deviceName,q};
  try{
    await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForTimeout(1800);
    const input=page.locator('#searchInput');
    await input.fill(q);
    const triggerAt=Date.now();
    await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
    await page.waitForFunction(()=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
      return !!d&&String(document.documentElement.dataset.earthlineRunState||'')==='published'&&String(d.tier||d.mode||'').toLowerCase()==='regional';
    },{timeout:120000});
    await page.waitForTimeout(600);
    outcome=await page.evaluate(({deviceName,q,triggerAt,started})=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
      const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
      return {
        device:deviceName,q,
        completed:true,
        query:d?.query||null,
        swales:Number(d?.derived?.swaleOpportunityLines||0),
        water:Number(d?.derived?.waterPaths||0),
        contours:Number(d?.derived?.contours||0),
        runState:String(document.documentElement.dataset.earthlineRunState||''),
        totalMs:Date.now()-triggerAt,
        pageMs:Date.now()-started,
        perf
      };
    },{deviceName,q,triggerAt,started});
  }catch(e){
    outcome={...outcome,completed:false,error:String(e?.message||e),elapsedMs:Date.now()-started};
    try{
      outcome.state=await page.evaluate(()=>({
        runState:String(document.documentElement.dataset.earthlineRunState||''),
        tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
        status:document.querySelector('#earthlineRunStatus,#runStatus')?.textContent||'',
        lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
        perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null
      }));
    }catch(_){}
  }
  outcome.errors=errors.slice(0,20);
  results.push(outcome);
  await context.close();
}
await browser.close();
console.log('M83_MOBILE_REGIONAL '+JSON.stringify(results));
if(results.some(r=>!r.completed))process.exitCode=2;
