import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const page=await context.newPage();
const errs=[];page.on('pageerror',e=>errs.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?co_prop_az_seq='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{state:'attached',timeout:25000});
await page.waitForTimeout(1200);

async function openPanel(){if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(250);}}
async function searchRun(q){
 await openPanel();
 const input=page.locator('#searchInput'); await input.click(); await input.fill(q); await page.waitForTimeout(900);
 const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:new RegExp(q,'i')}).first();
 if(await opt.count()){try{await opt.tap({timeout:8000});await page.waitForTimeout(300)}catch(_){}}
 const before=Date.now(); await page.evaluate(()=>document.getElementById('runBtn')?.click());
 try{await page.waitForFunction(()=>{
   if(window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970)return true;
   const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
   return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;
 },{timeout:45000,polling:150});}catch(_){}
 await page.waitForTimeout(500);
 return await page.evaluate(ms=>({
   query:document.getElementById('searchInput')?.value||'',
   wallMs:Date.now()-ms,
   perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
   err:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
   status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),
   tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
   runState:String(document.documentElement.dataset.earthlineRunState||''),
   propState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
   activeRun:String(document.documentElement.dataset.earthlineActiveRun||''),
   activeJurisdiction:window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556?.profileId||window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556?.identity?.id||null,
   displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null
 }),before);
}

const out={};
out.co=await searchRun('Colorado');
const prep=await page.evaluate(async()=>{
 const t={lng:-105.2705,lat:40.015};
 const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,t.lng,t.lat,20);
 const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
 if(!applied)return {ok:false,reason:'apply'};
 await new Promise(r=>setTimeout(r,900));
 const set=window.earthlineSetPropertyTarget16201({lng:t.lng,lat:t.lat,source:'co-prop-az-seq'},{openPanel:false});
 if(!set)return {ok:false,reason:'target'};
 let result=false,err=null;
 try{result=await window.earthlineDeclarePropertyAtCrosshair16169();}catch(e){err=String(e)}
 return {ok:!!result,err};
});
out.propertyPrep=prep;
out.afterProperty=await page.evaluate(()=>({
 tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
 propState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
 runState:String(document.documentElement.dataset.earthlineRunState||''),
 activeRun:String(document.documentElement.dataset.earthlineActiveRun||''),
 target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
 displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null
}));
out.az=await searchRun('Arizona');
out.final=await page.evaluate(()=>({
 tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
 propState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
 runState:String(document.documentElement.dataset.earthlineRunState||''),
 activeRun:String(document.documentElement.dataset.earthlineActiveRun||''),
 activeJurisdiction:window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556?.profileId||window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556?.identity?.id||null,
 lastState:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556?.profileId||window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556?.identity?.id||null,
 target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
 displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null
}));
console.log('EARTHLINE_CO_PROP_AZ_SEQ '+JSON.stringify({out,errs}));
await browser.close();
if(out.az.err||!/Arizona/i.test(out.az.query||'')||!/screening published\./i.test(out.az.status||''))process.exitCode=1;
