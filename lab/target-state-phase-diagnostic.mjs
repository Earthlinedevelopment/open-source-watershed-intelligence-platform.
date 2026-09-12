import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const VT={lng:-73.012909,lat:44.513845};
const browser=await chromium.launch({headless:true});
const results=[];

const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

async function openPage(){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto(URL+'?ny-transition-ab='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
  return page;
}

async function chooseRegion(page,name,timeout=26000){
  const beforeToken=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{}).runToken||''));
  await page.evaluate(q=>{const i=document.getElementById('searchInput');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));},name);
  await page.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
  const picked=await page.evaluate(name=>{const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const want=n(name);const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];const b=opts.find(x=>/state|region/i.test(String(x.textContent||''))&&(n(x.dataset.query||'')===want||n(x.textContent||'').includes(want)))||opts.find(x=>n(x.textContent||'').includes(want));if(!b)return null;const out={text:String(b.textContent||'').trim(),query:String(b.dataset.query||'')};b.click();return out;},name);
  if(!picked)throw new Error(name+' region option missing');
  const started=Date.now();let timeoutHit=false;
  try{await page.waitForFunction(({wanted,before})=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');const text=[d?.query,d?.name,d?.label,d?.stateBoundary?.query,d?.jurisdictionBoundary?.query,s].filter(Boolean).join(' ').toLowerCase();return d&&String(d.runToken||'')!==before&&text.includes(wanted)&&/screening published/i.test(s)&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';},{wanted:name.toLowerCase(),before:beforeToken},{timeout,polling:100});}catch(_){timeoutHit=true;}
  const snap=await page.evaluate(()=>({
    searchGen:Number(M?.searchGen||0),
    appliedSearchText:String(M?.appliedSearchText||''),
    displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    water:window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609||null,
    crossTier:window.EARTHLINE_CROSS_TIER_SUPERSEDE_AUDIT_16327||null,
    tierCommit:window.EARTHLINE_REGIONAL_TIER_COMMIT_16327||null,
    propertyPublication:M?.propertyPublication15816||null,
    propertyLock:M?.propertyResultLock15815||null,
    propertyFrame:M?.authoritativePropertyFrame15821||null,
    pendingFrame:M?.pendingAnalysisFrame15827||null,
    propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
    analysisTier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
    regionalState:window.earthlineRegional15778?{mode:window.earthlineRegional15778.mode,running:!!window.earthlineRegional15778.running,active:!!window.earthlineRegional15778.active}:null,
    runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true',
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'')
  }));
  return {picked,timeout:timeoutHit,elapsedMs:Date.now()-started,snap};
}

async function runVermontProperty(page){
  const prepared=await page.evaluate(async target=>{
    const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,target.lng,target.lat,20);
    const ok=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!ok)return false;
    await new Promise(r=>setTimeout(r,500));
    const set=window.earthlineSetPropertyTarget16201({lng:target.lng,lat:target.lat,source:'ny-transition-ab'},{openPanel:false});
    const b=document.getElementById('earthlineDeclareProperty16169');
    return !!set&&!!b&&!b.disabled;
  },VT);
  if(!prepared)throw new Error('Vermont Property preparation failed');
  const started=Date.now();
  const call=await page.evaluate(async()=>{try{return {result:await window.earthlineDeclarePropertyAtCrosshair16169(),error:null}}catch(e){return {result:null,error:String(e)}}});
  await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running',null,{timeout:18000,polling:100});
  const snap=await page.evaluate(()=>({
    searchGen:Number(M?.searchGen||0),
    appliedSearchText:String(M?.appliedSearchText||''),
    displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
    propertyAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    propertyPublication:M?.propertyPublication15816||null,
    propertyLock:M?.propertyResultLock15815||null,
    propertyFrame:M?.authoritativePropertyFrame15821||null,
    pendingFrame:M?.pendingAnalysisFrame15827||null,
    propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
    analysisTier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
    regionalState:window.earthlineRegional15778?{mode:window.earthlineRegional15778.mode,running:!!window.earthlineRegional15778.running,active:!!window.earthlineRegional15778.active}:null
  }));
  return {prepared,call,elapsedMs:Date.now()-started,snap};
}

for(const intervention of [false,true]){
  const page=await openPage();
  const vt=await chooseRegion(page,'Vermont');
  if(vt.timeout)throw new Error('Vermont Regional failed in '+(intervention?'intervention':'control'));
  const property=await runVermontProperty(page);
  let handoff=null;
  if(intervention){
    handoff=await page.evaluate(()=>{
      const before=Number(M?.searchGen||0);
      if(M)M.searchGen=before+1;
      const rs=window.earthlineRegional15778||null;
      if(rs){rs.running=false;rs.active=true;rs.mode='regional';rs.queuedRunCount15786=0;}
      document.documentElement.dataset.earthlinePropertyRunState='idle';
      document.documentElement.dataset.earthlineAnalysisTier='regional';
      document.documentElement.classList.remove('earthline-property-running-16233','earthline-direct-property-handoff-16250');
      try{window.earthlineApplyRendererOwnership15805?.('regional')}catch(_){}
      return {searchGenBefore:before,searchGenAfter:Number(M?.searchGen||0),publicationGen:Number(M?.propertyPublication15816?.searchGen),lockGen:Number(M?.propertyResultLock15815?.searchGen),displayedTier:String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{}).tier||'')};
    });
  }
  const ny=await chooseRegion(page,'New York',24000);
  results.push({case:intervention?'generation-supersede':'control',vt,property,handoff,ny});
  console.log('NY_TRANSITION_AB '+JSON.stringify(results.at(-1)));
  await page.close();
}

const report={generatedAt:new Date().toISOString(),url:URL,results};
await fs.mkdir('lab-results',{recursive:true});
await fs.writeFile('lab-results/target-state-phase-diagnostic.json',JSON.stringify(report,null,2));
console.log('NY_TRANSITION_AB_SUMMARY '+JSON.stringify(results.map(r=>({case:r.case,propertySearchGen:r.property.snap.searchGen,handoff:r.handoff,nyTimeout:r.ny.timeout,nyElapsedMs:r.ny.elapsedMs,nyFlowToken:r.ny.snap.flow?.runToken||null,nyDisplayedToken:r.ny.snap.displayed?.runToken||null,nyRunBusy:r.ny.snap.runBusy,nyStatus:r.ny.snap.status,crossTier:r.ny.snap.crossTier}))));
await browser.close();
