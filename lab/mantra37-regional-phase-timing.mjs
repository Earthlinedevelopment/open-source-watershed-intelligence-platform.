import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

async function boot(tag){
  await page.goto(URL+'?m37camera='+tag+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
}
async function chooseRegion(name){
  await page.evaluate(q=>{const i=document.getElementById('searchInput');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));},name);
  await page.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
  const picked=await page.evaluate(name=>{const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];const b=opts.find(x=>/state|region/i.test(x.textContent||'')&&(n(x.dataset.query||'')===n(name)||n(x.textContent||'').includes(n(name))))||opts.find(x=>n(x.textContent||'').includes(n(name)));if(!b)return false;b.click();return true;},name);
  if(!picked)throw new Error(name+' suggestion not found');
}
async function snap(){return page.evaluate(()=>{const m=typeof M!=='undefined'?M:null,d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,w=window.EARTHLINE_REGIONAL_STALL_WATCHDOG_16347||null,mp=window.earthlineMap;return {loc:String(m?.loc?.name||''),tier:String(d?.tier||d?.mode||''),status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,700),watchdog:w?{label:String(w.lastProgressLabel||''),elapsedMs:Number(w.elapsedMs||0),failed:!!w.failed}:null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191?JSON.parse(JSON.stringify(window.EARTHLINE_REGIONAL_PERFORMANCE_16191)):null,camera:mp?{moving:!!mp.isMoving?.(),zooming:!!mp.isZooming?.(),rotating:!!mp.isRotating?.(),center:mp.getCenter?.().toArray?.(),zoom:mp.getZoom?.()}:null,calls:window.M37_CAMERA_CALLS||[]};});}
async function runRegion(name,maxMs=34000){const started=Date.now(),trace=[];let last='';await chooseRegion(name);while(Date.now()-started<maxMs){const s=await snap(),label=s.watchdog?.label||'';if(label&&label!==last){trace.push({t:Date.now()-started,label,watchdogElapsed:s.watchdog?.elapsedMs||0,moving:s.camera?.moving,zoom:s.camera?.zoom});last=label;}if(/screening published/i.test(s.status)&&s.tier==='regional'&&norm(s.loc).includes(norm(name)))return {ok:true,elapsedMs:Date.now()-started,trace,final:s};if(/ANALYSIS FAILED|ANALYSIS STOPPED/i.test(s.status))return {ok:false,elapsedMs:Date.now()-started,trace,final:s};await page.waitForTimeout(75);}return {ok:false,elapsedMs:Date.now()-started,trace,final:await snap()};}
async function runProperty(source){const started=Date.now();const call=await page.evaluate(async source=>{const target={lng:-73.012909,lat:44.513845};const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,target.lng,target.lat,20);const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});if(!applied)return {ok:false,reason:'applyLocation rejected'};await new Promise(r=>setTimeout(r,800));const set=window.earthlineSetPropertyTarget16201({lng:target.lng,lat:target.lat,source},{openPanel:false});const b=document.getElementById('earthlineDeclareProperty16169');if(!set||!b||b.disabled)return {ok:false,reason:'property target unavailable'};try{return {ok:true,result:await window.earthlineDeclarePropertyAtCrosshair16169()};}catch(e){return {ok:false,reason:String(e)}}},source);try{await page.waitForFunction(()=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;return String(d?.tier||d?.mode||'').toLowerCase()==='property'&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';},null,{timeout:18000,polling:100});}catch(_){}return {call,elapsedMs:Date.now()-started,after:await snap()};}
async function patchInstantCamera(){return page.evaluate(()=>{const mp=window.earthlineMap;if(!mp)return {ok:false};window.M37_CAMERA_CALLS=[];for(const name of ['flyTo','easeTo','fitBounds']){if(typeof mp[name]!=='function')continue;const orig=mp[name].bind(mp);mp[name]=function(...args){const before={name,at:performance.now(),args:JSON.parse(JSON.stringify(args,(k,v)=>typeof v==='function'?'[fn]':v))};window.M37_CAMERA_CALLS.push(before);if(name==='fitBounds'){args[1]={...(args[1]||{}),duration:0,animate:false,linear:true};}else{args[0]={...(args[0]||{}),duration:0,animate:false};}return orig(...args);};}return {ok:true,center:mp.getCenter().toArray(),zoom:mp.getZoom()};});}

await boot('camera-ab');
const vt=await runRegion('Vermont',24000);console.log('M37_CAMERA_VT '+JSON.stringify(vt));if(!vt.ok)throw new Error('M37_CAMERA_VT_FAIL');
const property=await runProperty('m37-camera-ab');console.log('M37_CAMERA_PROPERTY '+JSON.stringify(property));
const patch=await patchInstantCamera();console.log('M37_CAMERA_PATCH '+JSON.stringify(patch));
const ny=await runRegion('New York',32000);console.log('M37_CAMERA_NY '+JSON.stringify(ny));
console.log('M37_CAMERA_RESULT '+JSON.stringify({nyElapsedMs:ny.elapsedMs,nyCoreMs:ny.final?.perf?.totalMs||null,calls:ny.final?.calls||[],trace:ny.trace}));
await browser.close();
if(!ny.ok||ny.elapsedMs>15000)throw new Error('M37_CAMERA_AB_FAIL elapsed='+ny.elapsedMs+' core='+(ny.final?.perf?.totalMs||null));
console.log('M37_CAMERA_AB_PASS elapsed='+ny.elapsedMs+' core='+(ny.final?.perf?.totalMs||null));
