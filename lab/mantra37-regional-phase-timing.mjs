import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const cdp=await page.context().newCDPSession(page);
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
  const m=typeof M!=='undefined'?M:null;
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const w=window.EARTHLINE_REGIONAL_STALL_WATCHDOG_16347||null;
  const audits={};
  for(const k of Object.keys(window)){
    if(/^EARTHLINE_.*(PROPERTY|LIVING|BASEMAP|PRESENT|TEXTURE|VISIBILITY|SETTLE|ENHANCE).*AUDIT/i.test(k)){
      try{audits[k]=JSON.parse(JSON.stringify(window[k]));}catch(_){}
    }
  }
  return {
    loc:String(m?.loc?.name||''),tier:String(d?.tier||d?.mode||''),token:d?.runToken||null,
    busy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true',
    propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,500),
    watchdog:w?{label:String(w.lastProgressLabel||''),elapsedMs:Number(w.elapsedMs||0),failed:!!w.failed}:null,
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191?JSON.parse(JSON.stringify(window.EARTHLINE_REGIONAL_PERFORMANCE_16191)):null,
    audits
  };
});}

async function runRegion(name,maxMs=32000){
  const started=Date.now(),trace=[]; let last='';
  await chooseRegion(name);
  while(Date.now()-started<maxMs){
    const s=await snap();
    const label=s.watchdog?.label||'';
    if(label&&label!==last){trace.push({t:Date.now()-started,label,watchdogElapsed:s.watchdog?.elapsedMs||0});last=label;}
    if(/screening published/i.test(s.status)&&s.tier==='regional'&&norm(s.loc).includes(norm(name)))return {ok:true,elapsedMs:Date.now()-started,trace,final:s};
    if(/ANALYSIS FAILED|ANALYSIS STOPPED/i.test(s.status))return {ok:false,elapsedMs:Date.now()-started,trace,final:s};
    await page.waitForTimeout(75);
  }
  return {ok:false,elapsedMs:Date.now()-started,trace,final:await snap()};
}

async function runProperty(source){
  const started=Date.now();
  const call=await page.evaluate(async source=>{
    const target={lng:-73.012909,lat:44.513845};
    const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,target.lng,target.lat,20);
    const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false,reason:'applyLocation rejected'};
    await new Promise(r=>setTimeout(r,800));
    const set=window.earthlineSetPropertyTarget16201({lng:target.lng,lat:target.lat,source},{openPanel:false});
    const b=document.getElementById('earthlineDeclareProperty16169');
    if(!set||!b||b.disabled)return {ok:false,reason:'property target unavailable'};
    try{return {ok:true,result:await window.earthlineDeclarePropertyAtCrosshair16169()};}catch(e){return {ok:false,reason:String(e)}}
  },source);
  try{await page.waitForFunction(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    return String(d?.tier||d?.mode||'').toLowerCase()==='property' && String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';
  },null,{timeout:18000,polling:100});}catch(_){}
  return {call,elapsedMs:Date.now()-started,after:await snap()};
}

async function manualRetirePresentation(){return page.evaluate(()=>{
  const mp=window.earthlineMap;
  const layers=mp?.getStyle?.()?.layers||[];
  const ids=layers.map(x=>x.id).filter(id=>/property|living-swales|swale-planting/i.test(String(id)));
  const hidden=[];
  for(const id of ids){try{if(mp.getLayer(id)){mp.setLayoutProperty(id,'visibility','none');hidden.push(id)}}catch(_){} }
  const overlays=[];
  for(const id of ['earthlinePropertyFrame15827','earthlinePropertyFlowOverlay15824','earthlinePropertyFlowOverlay15823']){
    const el=document.getElementById(id);if(el){el.style.display='none';overlays.push(id)}
  }
  return {count:hidden.length,ids:hidden,overlays};
});}

function summarizeCpu(profile){
  const byId=new Map(profile.nodes.map(n=>[n.id,n])); const selfUs=new Map();
  const samples=profile.samples||[],deltas=profile.timeDeltas||[];
  for(let i=0;i<samples.length;i++)selfUs.set(samples[i],(selfUs.get(samples[i])||0)+(deltas[i]||0));
  return [...selfUs.entries()].map(([id,us])=>{const n=byId.get(id)||{},f=n.callFrame||{};return {fn:String(f.functionName||'(anonymous)'),url:String(f.url||''),line:Number(f.lineNumber||0)+1,col:Number(f.columnNumber||0)+1,selfMs:Math.round(us/1000)}})
    .filter(x=>x.selfMs>0&&!/^idle$|^program$|^\(garbage collector\)$/i.test(x.fn)).sort((a,b)=>b.selfMs-a.selfMs).slice(0,40);
}

async function profiledRun(name,maxMs,label){
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval',{interval:1000}); await cdp.send('Profiler.start');
  const result=await runRegion(name,maxMs); const stopped=await cdp.send('Profiler.stop');
  console.log('M37_CPU_'+label+' '+JSON.stringify(summarizeCpu(stopped.profile))); return result;
}

await boot('fresh');
const fresh=await profiledRun('New York',24000,'FRESH_NY');
console.log('M37_TRACE_FRESH '+JSON.stringify(fresh));

await boot('baseline-transition');
const vt=await runRegion('Vermont',22000); if(!vt.ok)throw new Error('Vermont baseline precondition failed '+JSON.stringify(vt));
const property=await runProperty('m37-phase-cpu');
console.log('M37_PROPERTY_POST_PUBLISH '+JSON.stringify(property.after.audits||{}));
const transition=await profiledRun('New York',34000,'TRANSITION_NY');
console.log('M37_TRACE_TRANSITION '+JSON.stringify({vt,property,ny:transition}));

await boot('retire-ab');
const vtRetire=await runRegion('Vermont',22000); if(!vtRetire.ok)throw new Error('Vermont retire precondition failed '+JSON.stringify(vtRetire));
const propertyRetire=await runProperty('m37-retire-ab');
const retirement=await manualRetirePresentation();
const nyRetire=await runRegion('New York',34000);
console.log('M37_RETIRE_AB '+JSON.stringify({vt:vtRetire,property:propertyRetire,retirement,ny:nyRetire}));
console.log('M37_RETIRE_COMPARISON '+JSON.stringify({freshMs:fresh.elapsedMs,baselineTransitionMs:transition.elapsedMs,retiredTransitionMs:nyRetire.elapsedMs,deltaVsBaselineMs:nyRetire.elapsedMs-transition.elapsedMs,deltaVsFreshMs:nyRetire.elapsedMs-fresh.elapsedMs}));

await browser.close();
if(!nyRetire.ok||nyRetire.elapsedMs>15000)throw new Error('M37_RETIRE_AB_FAIL '+JSON.stringify({baseline:transition.elapsedMs,retired:nyRetire.elapsedMs,trace:nyRetire.trace}));
console.log('M37_RETIRE_AB_PASS retiredNY='+nyRetire.elapsedMs+' baselineNY='+transition.elapsedMs);
