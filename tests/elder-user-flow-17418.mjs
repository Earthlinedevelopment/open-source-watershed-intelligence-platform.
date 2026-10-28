import { chromium, firefox, webkit } from 'playwright';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const cases=[
  {name:'Vermont',query:'Vermont',lng:-72.5754,lat:44.2601},
  {name:'Colorado',query:'Colorado',lng:-105.27,lat:39.73}
];
const rows=[];
for(const c of cases){
  const context=await browser.newContext({viewport:{width:1700,height:950}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE+'?elderFlow17418='+encodeURIComponent(c.name)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.locator('#searchInput').fill(c.query);
  await page.waitForTimeout(700);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  if(await opts.count())await opts.first().click();
  const rb=page.locator('#runBtn');
  if(await rb.isVisible()){
    const busy=await rb.evaluate(b=>b.dataset.busy==='1'||b.disabled);
    if(!busy)await rb.click();
  }
  await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
  const regional=await page.evaluate(()=>window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null);
  const t0=Date.now();
  const result=await page.evaluate(async c=>{
    const target={lng:c.lng,lat:c.lat,source:'crosshair',code:'',score:0,at:new Date().toISOString()};
    if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(target,{openPanel:false});
    else window.EARTHLINE_PROPERTY_TARGET_16201=target;
    const api=window.EARTHLINE_ELDER_TREES_V1_17097;
    if(!api?.startProperty)return {ok:false,error:'Elder API unavailable'};
    const t=performance.now();
    let timedOut=false,summary=null;
    try{
      summary=await Promise.race([
        api.startProperty(),
        new Promise(resolve=>setTimeout(()=>{timedOut=true;resolve(null)},30000))
      ]);
    }catch(e){return {ok:false,error:String(e),elapsedMs:Math.round(performance.now()-t)}}
    const elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    return {ok:elder?.state==='committed'&&!timedOut,elapsedMs:Math.round(performance.now()-t),elder,summary};
  },c);
  const elapsedMs=Date.now()-t0;
  const pass=result.ok===true&&Number(result.elapsedMs)<=15000;
  const row={browser:BROWSER,name:c.name,pass,regionalCoreMs:regional?.totalMs??null,elderElapsedMs:result.elapsedMs??elapsedMs,
    state:result.elder?.state||null,featureCount:result.elder?.featureCount??null,candidatePool:result.elder?.dynamicCandidatePoolCount??null,
    workerTimings:result.elder?.workerTimings||null,error:result.error||result.elder?.error||null,errors};
  rows.push(row);
  console.log('EARTHLINE_ELDER_USER_FLOW_17418 '+JSON.stringify(row));
  await context.close();
}
await browser.close();
const summary={browser:BROWSER,total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,rows};
console.log('EARTHLINE_ELDER_USER_FLOW_17418_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
