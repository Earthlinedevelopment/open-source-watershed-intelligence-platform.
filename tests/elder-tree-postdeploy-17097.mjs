import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?elder_postdeploy_17097='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:25000});
await page.waitForFunction(()=>!!window.EARTHLINE_ELDER_TREES_V1_17097,{timeout:20000});

async function regional(q){
  await page.evaluate(query=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=query;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },q);
  await page.waitForFunction(()=>{
    if(window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970)return true;
    return /screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||''))&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;
  },{timeout:35000,polling:120});
  await page.waitForTimeout(500);
  return await page.evaluate(()=>({
    error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    summary:window.EARTHLINE_ELDER_TREES_V1_17097.summary(),
    gauge:String(document.getElementById('earthlineElderTreesGauge17097')?.textContent||''),
    confidenceRule:String(window.EARTHLINE_ELDER_TREES_V1_17097.confidenceRule||''),
    sample:window.EARTHLINE_ELDER_TREES_V1_17097.features().slice(0,4).map(f=>({
      confidence:f.properties?.elder_tree_confidence_pct??f.properties?.confidence_pct,
      source:f.properties?.source_name,
      record_class:f.properties?.record_class
    }))
  }));
}

const colorado=await regional('Colorado');
const arizona=await regional('Arizona');
const pass={
  colorado:!colorado.error&&colorado.summary?.total>0&&/48 candidates/i.test(colorado.gauge)&&Number(colorado.perf?.totalMs)<=15000,
  arizona:!arizona.error&&arizona.summary?.total>0&&/24 candidates/i.test(arizona.gauge)&&Number(arizona.perf?.totalMs)<=15000,
  confidence:/Elder Tree Confidence/i.test(arizona.confidenceRule)&&/local structural-evidence percentile/i.test(arizona.confidenceRule),
  sampleConfidence:[...colorado.sample,...arizona.sample].every(x=>Number.isFinite(Number(x.confidence))&&Number(x.confidence)>=0&&Number(x.confidence)<=100),
  noErrors:errors.length===0
};
console.log('EARTHLINE_ELDER_POSTDEPLOY_17097 '+JSON.stringify({colorado,arizona,pass,errors}));
await browser.close();
if(!Object.values(pass).every(Boolean))process.exitCode=1;
