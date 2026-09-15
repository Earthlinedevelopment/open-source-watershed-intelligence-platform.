import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

async function boot(tag){
  await page.goto(URL+'?m37trace='+tag+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
}
async function chooseRegion(name){
  await page.evaluate(q=>{const i=document.getElementById('searchInput');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));},name);
  await page.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
  const picked=await page.evaluate(name=>{
    const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
    const b=opts.find(x=>/state|region/i.test(x.textContent||'')&&(n(x.dataset.query||'')===n(name)||n(x.textContent||'').includes(n(name))))||opts.find(x=>n(x.textContent||'').includes(n(name)));
    if(!b)return false;b.click();return true;
  },name);
  if(!picked)throw new Error(name+' suggestion not found');
}
async function snap(){return page.evaluate(()=>{
  const m=typeof M!=='undefined'?M:null,d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,w=window.EARTHLINE_REGIONAL_STALL_WATCHDOG_16347||null;
  return {loc:String(m?.loc?.name||''),tier:String(d?.tier||d?.mode||''),token:d?.runToken||null,busy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true',propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,700),watchdog:w?{label:String(w.lastProgressLabel||''),elapsedMs:Number(w.elapsedMs||0),failed:!!w.failed}:null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191?JSON.parse(JSON.stringify(window.EARTHLINE_REGIONAL_PERFORMANCE_16191)):null,clearAudit:window.EARTHLINE_PROPERTY_TO_REGIONAL_CLEAR_AUDIT_16334?JSON.parse(JSON.stringify(window.EARTHLINE_PROPERTY_TO_REGIONAL_CLEAR_AUDIT_16334)):null};
});}
async function runRegion(name,maxMs=34000){
  const started=Date.now(),trace=[];let last='';await chooseRegion(name);
  while(Date.now()-started<maxMs){const s=await snap(),label=s.watchdog?.label||'';if(label&&label!==last){trace.push({t:Date.now()-started,label,watchdogElapsed:s.watchdog?.elapsedMs||0});last=label;}if(/screening published/i.test(s.status)&&s.tier==='regional'&&norm(s.loc).includes(norm(name)))return {ok:true,elapsedMs:Date.now()-started,trace,final:s};if(/ANALYSIS FAILED|ANALYSIS STOPPED/i.test(s.status))return {ok:false,elapsedMs:Date.now()-started,trace,final:s};await page.waitForTimeout(75);}return {ok:false,elapsedMs:Date.now()-started,trace,final:await snap()};
}
async function runProperty(source){
  const started=Date.now();const call=await page.evaluate(async source=>{const target={lng:-73.012909,lat:44.513845};const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,target.lng,target.lat,20);const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});if(!applied)return {ok:false,reason:'applyLocation rejected'};await new Promise(r=>setTimeout(r,800));const set=window.earthlineSetPropertyTarget16201({lng:target.lng,lat:target.lat,source},{openPanel:false});const b=document.getElementById('earthlineDeclareProperty16169');if(!set||!b||b.disabled)return {ok:false,reason:'property target unavailable'};try{return {ok:true,result:await window.earthlineDeclarePropertyAtCrosshair16169()};}catch(e){return {ok:false,reason:String(e)}}},source);
  try{await page.waitForFunction(()=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;return String(d?.tier||d?.mode||'').toLowerCase()==='property'&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';},null,{timeout:18000,polling:100});}catch(_){}
  return {call,elapsedMs:Date.now()-started,after:await snap()};
}
async function manualRetirePresentation(){return page.evaluate(()=>{const mp=window.earthlineMap,layers=mp?.getStyle?.()?.layers||[],ids=layers.map(x=>x.id).filter(id=>/property|living-swales|swale-planting/i.test(String(id))),hidden=[];for(const id of ids){try{if(mp.getLayer(id)){mp.setLayoutProperty(id,'visibility','none');hidden.push(id)}}catch(_){}}const overlays=[];for(const id of ['earthlinePropertyFrame15827','earthlinePropertyFlowOverlay15824','earthlinePropertyFlowOverlay15823']){const el=document.getElementById(id);if(el){el.style.display='none';overlays.push(id)}}return {count:hidden.length,ids:hidden,overlays};});}
async function bootPassingVT(tag,maxAttempts=3){const attempts=[];for(let i=1;i<=maxAttempts;i++){await boot(tag+'-'+i);const r=await runRegion('Vermont',24000);attempts.push(r);console.log('M37_VT_ATTEMPT '+JSON.stringify({tag,attempt:i,ok:r.ok,elapsedMs:r.elapsedMs,status:r.final?.status,perf:r.final?.perf}));if(r.ok)return {ok:true,attempts,vt:r};}return {ok:false,attempts,vt:attempts.at(-1)};}

await boot('fresh-ny-1');const fresh1=await runRegion('New York',26000);console.log('M37_FRESH_NY_1 '+JSON.stringify(fresh1));
await boot('fresh-ny-2');const fresh2=await runRegion('New York',26000);console.log('M37_FRESH_NY_2 '+JSON.stringify(fresh2));

const baseVT=await bootPassingVT('baseline-vt');
let baseline=null;
if(baseVT.ok){const property=await runProperty('m37-baseline');const ny=await runRegion('New York',36000);baseline={vt:baseVT.vt,property,ny};console.log('M37_BASELINE_TRANSITION '+JSON.stringify(baseline));}
else console.log('M37_BASELINE_BLOCKED '+JSON.stringify(baseVT));

const retireVT=await bootPassingVT('retire-vt');
let retired=null;
if(retireVT.ok){const property=await runProperty('m37-retire-ab');const retirement=await manualRetirePresentation();const ny=await runRegion('New York',36000);retired={vt:retireVT.vt,property,retirement,ny};console.log('M37_RETIRE_AB '+JSON.stringify(retired));}
else console.log('M37_RETIRE_BLOCKED '+JSON.stringify(retireVT));

console.log('M37_COMPARISON '+JSON.stringify({fresh1:{ok:fresh1.ok,elapsedMs:fresh1.elapsedMs,core:fresh1.final?.perf?.totalMs||null},fresh2:{ok:fresh2.ok,elapsedMs:fresh2.elapsedMs,core:fresh2.final?.perf?.totalMs||null},baseline:baseline?{ok:baseline.ny.ok,elapsedMs:baseline.ny.elapsedMs,core:baseline.ny.final?.perf?.totalMs||null}:null,retired:retired?{ok:retired.ny.ok,elapsedMs:retired.ny.elapsedMs,core:retired.ny.final?.perf?.totalMs||null,hidden:retired.retirement.count}:null}));
await browser.close();
if(!baseline||!retired)throw new Error('M37_CONTROL_SOURCE_UNSTABLE');
if(!retired.ny.ok||retired.ny.elapsedMs>15000)throw new Error('M37_RETIRE_AB_FAIL baseline='+baseline.ny.elapsedMs+' retired='+retired.ny.elapsedMs);
console.log('M37_RETIRE_AB_PASS baseline='+baseline.ny.elapsedMs+' retired='+retired.ny.elapsedMs);
