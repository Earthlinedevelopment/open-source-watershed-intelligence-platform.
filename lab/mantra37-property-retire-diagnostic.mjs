import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

await page.goto(URL+'?m37retire='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
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
  return {loc:String(m?.loc?.name||''),tier:d?.tier||d?.mode||null,token:d?.runToken||null,busy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true',status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,400)};
});}

async function runRegion(name,maxMs=18000){
  const start=Date.now();
  await chooseRegion(name);
  while(Date.now()-start<maxMs){
    const s=await snap();
    if(/screening published/i.test(s.status)&&s.tier==='regional'&&norm(s.loc).includes(norm(name)))return {ok:true,elapsedMs:Date.now()-start,final:s};
    if(/ANALYSIS FAILED/i.test(s.status))return {ok:false,elapsedMs:Date.now()-start,final:s};
    await page.waitForTimeout(250);
  }
  return {ok:false,elapsedMs:Date.now()-start,final:await snap()};
}

const vt=await runRegion('Vermont');
if(!vt.ok)throw new Error('Vermont did not publish: '+JSON.stringify(vt));

const propertyStart=Date.now();
const property=await page.evaluate(async()=>{
  const target={lng:-73.012909,lat:44.513845};
  const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,target.lng,target.lat,20);
  const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
  if(!applied)return {ok:false,reason:'applyLocation rejected'};
  await new Promise(r=>setTimeout(r,800));
  const set=window.earthlineSetPropertyTarget16201({lng:target.lng,lat:target.lat,source:'m37-retire-diagnostic'},{openPanel:false});
  const b=document.getElementById('earthlineDeclareProperty16169');
  if(!set||!b||b.disabled)return {ok:false,reason:'property target unavailable'};
  try{return {ok:true,result:await window.earthlineDeclarePropertyAtCrosshair16169()};}catch(e){return {ok:false,reason:String(e)}}
});
try{await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return a.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';},null,{timeout:15000,polling:100});}catch(_){}
property.elapsedMs=Date.now()-propertyStart;
property.after=await snap();

const retirement=await page.evaluate(()=>{
  const mp=window.earthlineMap;
  const layers=mp?.getStyle?.()?.layers||[];
  const ids=layers.map(x=>x.id).filter(id=>/property|living-swales|swale-planting/i.test(String(id)));
  const hidden=[];
  for(const id of ids){try{if(mp.getLayer(id)){mp.setLayoutProperty(id,'visibility','none');hidden.push(id)}}catch(_){} }
  for(const id of ['earthlinePropertyFrame15827','earthlinePropertyFlowOverlay15824','earthlinePropertyFlowOverlay15823']){const el=document.getElementById(id);if(el)el.style.display='none';}
  return {count:hidden.length,ids:hidden};
});

const ny=await runRegion('New York',18000);
console.log('M37_PROPERTY_RETIRE_DIAGNOSTIC '+JSON.stringify({vt,property,retirement,ny}));
await browser.close();
