import {webkit,devices} from 'playwright';

const cases=[
  {name:'desktop-webkit',context:{viewport:{width:1440,height:900}}},
  {name:'iphone-webkit',context:{...devices['iPhone 13']}}
];

for(const cfg of cases){
  const browser=await webkit.launch({headless:true});
  const context=await browser.newContext(cfg.context);
  const page=await context.newPage();
  const errors=[],consoleRows=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>consoleRows.push({type:m.type(),text:m.text()}));
  let result={name:cfg.name};
  try{
    await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForTimeout(1500);
    await page.locator('#searchInput').fill('Vermont');
    const t0=Date.now();
    await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
    for(let i=0;i<12;i++){
      await page.waitForTimeout(5000);
      const snap=await page.evaluate(()=>({
        runState:String(document.documentElement.dataset.earthlineRunState||''),
        tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
        statusText:(document.querySelector('#earthlineRunStatus,#runStatus')?.textContent||'').trim(),
        displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
        lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
        perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
        terminal:window.EARTHLINE_REGIONAL_TERMINAL_16539||null,
        progress:window.EARTHLINE_REGIONAL_PROGRESS_16347||null,
        generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null
      }));
      console.log('M83_WEBKIT_SNAP '+JSON.stringify({name:cfg.name,sec:(i+1)*5,snap}));
      if(snap.runState==='published'){result={...result,completed:true,ms:Date.now()-t0,snap};break;}
    }
    if(!result.completed){
      result.final=await page.evaluate(()=>({
        runState:String(document.documentElement.dataset.earthlineRunState||''),
        tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
        statusText:(document.querySelector('#earthlineRunStatus,#runStatus')?.textContent||'').trim(),
        displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
        lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
        perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
        terminal:window.EARTHLINE_REGIONAL_TERMINAL_16539||null,
        progress:window.EARTHLINE_REGIONAL_PROGRESS_16347||null,
        terrainAudit:window.EARTHLINE_TERRAIN_GAP_REFINEMENT_16730||null,
        scaleAudit:window.EARTHLINE_SCALE_REFINED_INPUT_16702||null,
        fineAudit:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16780||null
      }));
    }
  }catch(e){result.error=String(e?.message||e);}
  result.errors=errors;
  result.consoleErrors=consoleRows.filter(x=>x.type==='error').slice(0,40);
  console.log('M83_WEBKIT_DIAG '+JSON.stringify(result));
  await browser.close();
}
