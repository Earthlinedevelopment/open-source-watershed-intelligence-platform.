import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

await page.goto(URL+'?m37phases='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});

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
  return {
    loc:String(m?.loc?.name||''),tier:String(d?.tier||d?.mode||''),token:d?.runToken||null,
    busy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true',
    propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,500),
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191?JSON.parse(JSON.stringify(window.EARTHLINE_REGIONAL_PERFORMANCE_16191)):null
  };
});}

async function runRegion(name,maxMs=26000){
  const started=Date.now(); await chooseRegion(name);
  while(Date.now()-started<maxMs){
    const s=await snap();
    if(/screening published/i.test(s.status)&&s.tier==='regional'&&norm(s.loc).includes(norm(name)))return {ok:true,elapsedMs:Date.now()-started,final:s};
    if(/ANALYSIS FAILED|ANALYSIS STOPPED/i.test(s.status))return {ok:false,elapsedMs:Date.now()-started,final:s};
    await page.waitForTimeout(150);
  }
  return {ok:false,elapsedMs:Date.now()-started,final:await snap()};
}

const freshStart=Date.now();
const fresh=await runRegion('New York');
console.log('M37_PHASE_FRESH '+JSON.stringify(fresh));

await page.reload({waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});

const vt=await runRegion('Vermont',20000);
if(!vt.ok)throw new Error('Vermont precondition failed '+JSON.stringify(vt));

const propertyStart=Date.now();
const propertyCall=await page.evaluate(async()=>{
  const target={lng:-73.012909,lat:44.513845};
  const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,target.lng,target.lat,20);
  const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
  if(!applied)return {ok:false,reason:'applyLocation rejected'};
  await new Promise(r=>setTimeout(r,800));
  const set=window.earthlineSetPropertyTarget16201({lng:target.lng,lat:target.lat,source:'m37-phase-timing'},{openPanel:false});
  const b=document.getElementById('earthlineDeclareProperty16169');
  if(!set||!b||b.disabled)return {ok:false,reason:'property target unavailable'};
  try{return {ok:true,result:await window.earthlineDeclarePropertyAtCrosshair16169()};}catch(e){return {ok:false,reason:String(e)}}
});
try{await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  return String(d?.tier||d?.mode||'').toLowerCase()==='property' && String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';
},null,{timeout:18000,polling:100});}catch(_){}
const property={call:propertyCall,elapsedMs:Date.now()-propertyStart,after:await snap()};

const transition=await runRegion('New York',26000);
console.log('M37_PHASE_TRANSITION '+JSON.stringify({vt,property,ny:transition}));

await browser.close();
