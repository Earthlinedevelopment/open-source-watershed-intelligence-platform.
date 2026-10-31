import {chromium,webkit,devices} from 'playwright';

const CASES=[
  {name:'Desktop Chromium',browserType:chromium,context:{viewport:{width:1440,height:900}}},
  {name:'Desktop WebKit',browserType:webkit,context:{viewport:{width:1440,height:900}}},
  {name:'iPhone WebKit',browserType:webkit,context:{...devices['iPhone 13']}},
  {name:'Pixel Chromium',browserType:chromium,context:{...devices['Pixel 7']}}
];

async function runRegional(page,q){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill(q);
  const t0=Date.now();
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    return !!d && String(d.runToken||'')!==String(prev||'') &&
      String(document.documentElement.dataset.earthlineRunState||'')==='published' &&
      String(d.tier||d.mode||'').toLowerCase()==='regional';
  },before,{timeout:60000});
  await page.waitForTimeout(500);
  return await page.evaluate(t0=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||{};
    const swales=v.swales?.features||[];
    let maxSlope=-Infinity;
    for(const f of swales){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))maxSlope=Math.max(maxSlope,n);}
    return {
      ms:Date.now()-t0,
      swales:Number(d?.derived?.swaleOpportunityLines||0),
      water:Number(d?.derived?.waterPaths||0),
      contours:Number(d?.derived?.contours||0),
      rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,
      maxSlope:Number.isFinite(maxSlope)?maxSlope:null
    };
  },t0);
}

async function runProperty(page,q){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill(q);
  const t0=Date.now();
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    return !!d && String(d.runToken||'')!==String(prev||'') &&
      String(d.tier||d.mode||'').toLowerCase()==='property';
  },before,{timeout:90000});
  await page.waitForTimeout(800);
  return await page.evaluate(t0=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    const m=(typeof M!=='undefined'&&M)||window.M||{};
    const safe=Array.isArray(m.authoritativeSafeSwales15815)?m.authoritativeSafeSwales15815:(Array.isArray(m.swales)?m.swales:[]);
    return {
      ms:Date.now()-t0,
      safeSwales:safe.length,
      analysisReady:!!m.analysisReady,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      elderCount:Number(window.EARTHLINE_ELDER_TREE_COUNT||window.EARTHLINE_PROPERTY_ELDER_COUNT||0)
    };
  },t0);
}

const results=[];
for(const cfg of CASES){
  const browser=await cfg.browserType.launch({headless:true});
  const context=await browser.newContext(cfg.context);
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  const row={name:cfg.name};
  try{
    await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForTimeout(1800);
    row.regional=await runRegional(page,'Vermont');
    row.regional2=await runRegional(page,'Arizona');
    row.property=await runProperty(page,'61 Sleepy Hollow Rd Essex Vermont');
    row.pass=
      row.regional.swales>0 && row.regional.rendered>0 &&
      row.regional2.swales>0 && row.regional2.rendered>0 &&
      (row.regional.maxSlope===null||row.regional.maxSlope<=4) &&
      (row.regional2.maxSlope===null||row.regional2.maxSlope<=4) &&
      row.property.analysisReady && row.property.safeSwales>0;
  }catch(e){
    row.pass=false;
    row.error=String(e?.message||e);
    try{row.state=await page.evaluate(()=>({
      runState:String(document.documentElement.dataset.earthlineRunState||''),
      tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
      displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
      lastRegionalError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
    }));}catch(_){}
  }
  row.errors=errors.slice(0,20);
  results.push(row);
  await browser.close();
}
console.log('M83_UNIFIED_CLIENT_MATRIX '+JSON.stringify(results));
if(results.some(r=>!r.pass))process.exitCode=2;
