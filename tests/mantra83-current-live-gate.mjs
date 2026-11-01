import {chromium,webkit,devices} from 'playwright';
import fs from 'node:fs';

const client=process.env.CLIENT||'chrome';
const isWebKit=client.includes('webkit');
let browserType=isWebKit?webkit:chromium;
let launchOpts={headless:true};
if(!isWebKit){
  const paths=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
  const executablePath=paths.find(p=>fs.existsSync(p));
  if(!executablePath)throw new Error('system Chrome missing');
  launchOpts={headless:true,executablePath,args:['--no-sandbox']};
}
const contextOpts=client.includes('iphone')?{...devices['iPhone 13']}:{viewport:{width:1440,height:900}};
const browser=await browserType.launch(launchOpts);
const context=await browser.newContext(contextOpts);
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(1200);

async function run(q,tier){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill(q);
  const t0=Date.now();
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(({before,tier})=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    return !!d && String(d.runToken||'')!==String(before||'') &&
      String(d.tier||d.mode||'').toLowerCase()===tier;
  },{before,tier},{timeout:tier==='property'?120000:90000});
  await page.waitForTimeout(1000);
  return await page.evaluate(({t0,tier})=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||{};
    const fs=v.swales?.features||[];
    let maxSlope=-Infinity;
    for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))maxSlope=Math.max(maxSlope,n);}
    let elderCount=0,elderSummary=null;
    try{elderCount=(window.EARTHLINE_ELDER_TREES_V1_17097?.features?.()||[]).length;elderSummary=window.EARTHLINE_ELDER_TREES_V1_17097?.summary?.()||null}catch(_){}
    const m=(typeof M!=='undefined'&&M)||window.M||{};
    const safe=Array.isArray(m.authoritativeSafeSwales15815)?m.authoritativeSafeSwales15815:(Array.isArray(m.swales)?m.swales:[]);
    return {
      tier:String(d.tier||d.mode||'').toLowerCase(),
      ms:Date.now()-t0,
      swales:Number(d?.derived?.swaleOpportunityLines||0),
      rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,
      maxSlope:Number.isFinite(maxSlope)?maxSlope:null,
      propertyReady:!!m.analysisReady,
      propertySafeSwales:safe.length,
      elderCount,elderSummary
    };
  },{t0,tier});
}

const regionalA=await run('Arizona','regional');
const regionalV=await run('Vermont','regional');
const property=await run('61 Sleepy Hollow Rd Essex Vermont','property');

const failures=[];
for(const [name,r] of [['Arizona',regionalA],['Vermont',regionalV]]){
  if(r.swales<=0||r.rendered<=0)failures.push(name+' Regional blank');
  if(r.maxSlope!==null&&r.maxSlope>4)failures.push(name+' slope '+r.maxSlope);
  if(r.ms>90000)failures.push(name+' Regional too slow '+r.ms);
}
if(!property.propertyReady||property.propertySafeSwales<=0)failures.push('Property incomplete');
if(property.elderCount<=0)failures.push('Property Elders absent');
if(errors.length)failures.push('page errors: '+errors.join(' | '));

console.log('M83_CURRENT_LIVE_GATE '+JSON.stringify({client,regionalA,regionalV,property,errors,failures}));
if(failures.length)process.exitCode=2;
await browser.close();
