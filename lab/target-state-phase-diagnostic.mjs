import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const VT={lng:-73.012909,lat:44.513845};
const browser=await chromium.launch({headless:true});
const results=[];

async function openPage(){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto(URL+'?ny-transition-ab='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
  return page;
}

async function snap(page){return page.evaluate(()=>({
  searchGen:Number(M?.searchGen||0),
  appliedSearchText:String(M?.appliedSearchText||''),
  displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
  renderSettlement:(window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null)?.renderSettlement||null,
  flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
  water:window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609||null,
  crossTier:window.EARTHLINE_CROSS_TIER_SUPERSEDE_AUDIT_16327||null,
  tierCommit:window.EARTHLINE_REGIONAL_TIER_COMMIT_16327||null,
  propertyAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  propertyPublication:M?.propertyPublication15816||null,
  propertyLock:M?.propertyResultLock15815||null,
  propertyFrame:M?.authoritativePropertyFrame15821||null,
  pendingFrame:M?.pendingAnalysisFrame15827||null,
  propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
  analysisTier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
  regionalState:window.earthlineRegional15778?{mode:window.earthlineRegional15778.mode,running:!!window.earthlineRegional15778.running,active:!!window.earthlineRegional15778.active,queued:Number(window.earthlineRegional15778.queuedRunCount15786||0)}:null,
  runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true',
  status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
}));}

async function chooseRegion(page,name,timeout=22000){
  const started=Date.now();
  await page.evaluate(q=>{const i=document.getElementById('searchInput');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));},name);
  await page.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
  const picked=await page.evaluate(name=>{
    const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
    const b=opts.find(x=>/state|region/i.test(x.textContent||'')&&(n(x.dataset.query||'')===n(name)||n(x.textContent||'').includes(n(name))))||opts.find(x=>n(x.textContent||'').includes(n(name)));
    if(!b)return null;const r={text:(b.textContent||'').trim(),q:b.dataset.query||''};b.click();return r;
  },name);
  if(!picked)return {name,picked:null,timeout:true,elapsedMs:Date.now()-started,snap:await snap(page),error:'suggestion missing'};
  let timeoutHit=false;
  try{await page.waitForFunction(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
    const rs=d?.renderSettlement;
    return /ANALYSIS FAILED|screening published/i.test(s)&&(rs?.coreVisible===true||/ANALYSIS FAILED/i.test(s));
  },null,{timeout,polling:150});}catch(_){timeoutHit=true;}
  return {name,picked,timeout:timeoutHit,elapsedMs:Date.now()-started,snap:await snap(page)};
}

async function runVermontProperty(page){
  const started=Date.now();
  const prepared=await page.evaluate(async target=>{
    const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,target.lng,target.lat,20);
    const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false,reason:'applyLocation rejected'};
    await new Promise(r=>setTimeout(r,800));
    const set=window.earthlineSetPropertyTarget16201({lng:target.lng,lat:target.lat,source:'ny-transition-ab'},{openPanel:false});
    const b=document.getElementById('earthlineDeclareProperty16169');
    return {ok:!!set&&!!b&&!b.disabled};
  },VT);
  if(!prepared.ok)return {prepared,timeout:true,elapsedMs:Date.now()-started,snap:await snap(page)};
  const call=await page.evaluate(async()=>{try{return {result:await window.earthlineDeclarePropertyAtCrosshair16169(),error:null}}catch(e){return {result:null,error:String(e)}}});
  let timeoutHit=false;
  try{await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return a.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';},null,{timeout:18000,polling:120});}catch(_){timeoutHit=true;}
  return {prepared,call,timeout:timeoutHit,elapsedMs:Date.now()-started,snap:await snap(page)};
}

for(const intervention of [false,true]){
  const page=await openPage();
  const vt=await chooseRegion(page,'Vermont',26000);
  let property=null,preNy=null,ny=null;
  if(!vt.timeout){
    property=await runVermontProperty(page);
    preNy=await snap(page);
    if(intervention && !property.timeout){
      // Test-only: make the completed Property result visible to the EXISTING 16327 supersede owner.
      // Product code remains unchanged. If this makes NY pass, the defect is the priorProperty predicate.
      await page.evaluate(()=>{document.documentElement.dataset.earthlinePropertyRunState='running';});
    }
    ny=await chooseRegion(page,'New York',26000);
  }
  const row={case:intervention?'existing-16327-owner-forced-visible':'control',vt,property,preNy,ny};
  results.push(row);
  console.log('NY_TRANSITION_AB '+JSON.stringify(row));
  await page.close();
}

await fs.mkdir('lab-results',{recursive:true});
await fs.writeFile('lab-results/target-state-phase-diagnostic.json',JSON.stringify({generatedAt:new Date().toISOString(),url:URL,results},null,2));
console.log('NY_TRANSITION_AB_SUMMARY '+JSON.stringify(results.map(r=>({
  case:r.case,
  vtTimeout:r.vt?.timeout,
  propertyTimeout:r.property?.timeout,
  preNySearchGen:r.preNy?.searchGen,
  preNyDisplayedTier:String(r.preNy?.displayed?.tier||r.preNy?.displayed?.mode||''),
  preNyPropertyState:r.preNy?.propertyState,
  propertyCommitted:r.preNy?.propertyPublication?.committed===true,
  publicationGen:r.preNy?.propertyPublication?.searchGen??null,
  lockGen:r.preNy?.propertyLock?.searchGen??null,
  nyTimeout:r.ny?.timeout,
  nyElapsedMs:r.ny?.elapsedMs,
  nySearchGen:r.ny?.snap?.searchGen,
  nyFlowToken:r.ny?.snap?.flow?.runToken||null,
  nyWaterToken:r.ny?.snap?.water?.runToken||null,
  nyDisplayedToken:r.ny?.snap?.displayed?.runToken||null,
  nyRunBusy:r.ny?.snap?.runBusy,
  crossTier:r.ny?.snap?.crossTier||null,
  nyStatus:r.ny?.snap?.status||null
}))));
await browser.close();
