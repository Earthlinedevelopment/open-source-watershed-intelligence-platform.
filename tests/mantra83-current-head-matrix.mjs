import {chromium,webkit,devices} from 'playwright';
import fs from 'node:fs';

const chromePaths=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const chromePath=chromePaths.find(p=>fs.existsSync(p));
if(!chromePath)throw new Error('system Chrome not found');

const cases=[
  {name:'desktop-chromium',type:chromium,launch:{headless:true,executablePath:chromePath,args:['--no-sandbox']},ctx:{viewport:{width:1440,height:900}}},
  {name:'desktop-webkit',type:webkit,launch:{headless:true},ctx:{viewport:{width:1440,height:900}}},
  {name:'iphone-webkit',type:webkit,launch:{headless:true},ctx:{...devices['iPhone 13']}},
  {name:'pixel-chromium',type:chromium,launch:{headless:true,executablePath:chromePath,args:['--no-sandbox']},ctx:{...devices['Pixel 7']}}
];

async function regional(page,q){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill(q);
  const t0=Date.now();
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published'&&String(d.tier||d.mode||'').toLowerCase()==='regional';
  },before,{timeout:90000});
  await page.waitForTimeout(350);
  return await page.evaluate(t0=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    let maxSlope=-Infinity;
    for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))maxSlope=Math.max(maxSlope,n);}
    return {
      ms:Date.now()-t0,q:d?.query||null,
      swales:Number(d?.derived?.swaleOpportunityLines||0),
      rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,
      maxSlope:Number.isFinite(maxSlope)?maxSlope:null
    };
  },t0);
}
async function property(page){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill('61 Sleepy Hollow Rd Essex Vermont');
  const t0=Date.now();
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    return !!d&&String(d.runToken||'')!==String(prev||'')&&String(d.tier||d.mode||'').toLowerCase()==='property';
  },before,{timeout:120000});
  await page.waitForTimeout(1200);
  return await page.evaluate(t0=>{
    const m=(typeof M!=='undefined'&&M)||window.M||{};
    const safe=Array.isArray(m.authoritativeSafeSwales15815)?m.authoritativeSafeSwales15815:(Array.isArray(m.swales)?m.swales:[]);
    let elderSummary=null,elderFeatures=[];
    try{elderSummary=window.EARTHLINE_ELDER_TREES_V1_17097?.summary?.()||null;elderFeatures=window.EARTHLINE_ELDER_TREES_V1_17097?.features?.()||[]}catch(_){}
    return {ms:Date.now()-t0,analysisReady:!!m.analysisReady,safeSwales:safe.length,elderCount:Array.isArray(elderFeatures)?elderFeatures.length:0,elderSummary};
  },t0);
}

const results=[];
for(const cfg of cases){
  const browser=await cfg.type.launch(cfg.launch);
  const context=await browser.newContext(cfg.ctx);
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const row={name:cfg.name,errors};
  try{
    await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
    await page.waitForTimeout(1200);
    row.vt=await regional(page,'Vermont');
    row.az=await regional(page,'Arizona');
    row.property=await property(page);
    row.pass=row.vt.swales>0&&row.vt.rendered>0&&row.az.swales>0&&row.az.rendered>0&&
      (row.vt.maxSlope===null||row.vt.maxSlope<=4)&&(row.az.maxSlope===null||row.az.maxSlope<=4)&&
      row.property.analysisReady&&row.property.safeSwales>0&&row.property.elderCount>0&&errors.length===0;
  }catch(e){row.pass=false;row.error=String(e?.message||e);}
  results.push(row);
  await browser.close();
}
console.log('M83_CURRENT_HEAD_MATRIX '+JSON.stringify(results));
if(results.some(r=>!r.pass))process.exitCode=2;
