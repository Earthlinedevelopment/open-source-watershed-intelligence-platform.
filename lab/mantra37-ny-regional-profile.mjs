import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});

const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

async function setupPage(){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=[];
  page.on('pageerror',e=>errors.push({type:'pageerror',message:String(e)}));
  page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()});});
  await page.goto(URL+'?m37profile='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
  return {page,errors};
}

async function chooseRegion(page,name){
  await page.evaluate(q=>{const i=document.getElementById('searchInput');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));},name);
  await page.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
  const picked=await page.evaluate(name=>{
    const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
    const b=opts.find(x=>/state|region/i.test(x.textContent||'')&&(n(x.dataset.query||'')===n(name)||n(x.textContent||'').includes(n(name))))||opts.find(x=>n(x.textContent||'').includes(n(name)));
    if(!b)return null;const r={text:(b.textContent||'').trim(),q:b.dataset.query||''};b.click();return r;
  },name);
  if(!picked)throw new Error(name+' suggestion not found');
  return picked;
}

async function snapshot(page){
  return page.evaluate(()=>{
    const m=typeof M!=='undefined'?M:null;
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const fa=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const fwa=window.EARTHLINE_FINAL_MAPPED_WATER_FLOW_AUDIT_16628||null;
    const rd=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    return {
      at:Date.now(),
      loc:String(m?.loc?.name||''),
      searchGen:m?.searchGen??null,
      displayedToken:d?.runToken||null,
      displayedTier:d?.tier||d?.mode||null,
      flowToken:fa?.runToken||null,
      flowSegments:fa?.segments??null,
      finalWaterToken:fwa?.runToken||null,
      regionalDisplay:{waterPaths:rd?.waterPaths??null,swaleLines:rd?.swaleLines??null,renderedAt:rd?.renderedAt??null},
      runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true',
      propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,500)
    };
  });
}

async function profileRegion(page,name,maxMs=22000){
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval',{interval:100});
  await cdp.send('Profiler.start');
  const timeline=[];
  const started=Date.now();
  const picked=await chooseRegion(page,name);
  let published=false;
  while(Date.now()-started<maxMs){
    const s=await snapshot(page);timeline.push({...s,t:Date.now()-started});
    if(/screening published/i.test(s.status)&&s.displayedTier==='regional'&&norm(s.loc).includes(norm(name))){published=true;break;}
    if(/ANALYSIS FAILED/i.test(s.status))break;
    await page.waitForTimeout(400);
  }
  const elapsedMs=Date.now()-started;
  const {profile}=await cdp.send('Profiler.stop');
  await cdp.detach();
  const byId=new Map(profile.nodes.map(n=>[n.id,n]));
  const totals=new Map();
  const samples=profile.samples||[],deltas=profile.timeDeltas||[];
  for(let i=0;i<samples.length;i++)totals.set(samples[i],(totals.get(samples[i])||0)+(deltas[i]||0));
  const hot=[...totals.entries()].map(([id,us])=>{
    const n=byId.get(id)||{};const cf=n.callFrame||{};
    return {ms:Math.round(us/100)/10,functionName:cf.functionName||'(anonymous)',url:cf.url||'',lineNumber:cf.lineNumber??null};
  }).sort((a,b)=>b.ms-a.ms).slice(0,30);
  return {name,picked,published,elapsedMs,hot,timeline,final:await snapshot(page)};
}

async function runFreshNY(){
  const {page,errors}=await setupPage();
  const result=await profileRegion(page,'New York');
  result.errors=errors;
  await page.close();
  return result;
}

async function runTransition(){
  const {page,errors}=await setupPage();
  const vt=await profileRegion(page,'Vermont',18000);
  let property=null;
  if(vt.published){
    const started=Date.now();
    property=await page.evaluate(async()=>{
      const target={lng:-73.012909,lat:44.513845};
      const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,target.lng,target.lat,20);
      const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
      if(!applied)return {ok:false,reason:'applyLocation rejected'};
      await new Promise(r=>setTimeout(r,800));
      const set=window.earthlineSetPropertyTarget16201({lng:target.lng,lat:target.lat,source:'mantra37-profile'},{openPanel:false});
      const b=document.getElementById('earthlineDeclareProperty16169');
      if(!set||!b||b.disabled)return {ok:false,reason:'property target unavailable'};
      try{const result=await window.earthlineDeclarePropertyAtCrosshair16169();return {ok:true,result};}catch(e){return {ok:false,reason:String(e)}}
    });
    try{await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return a.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';},null,{timeout:15000,polling:120});}catch(_){}
    property.elapsedMs=Date.now()-started;
    property.after=await snapshot(page);
  }
  const ny=await profileRegion(page,'New York');
  const result={vt,property,ny,errors};
  await page.close();
  return result;
}

const fresh=await runFreshNY();
const transition=await runTransition();
const report={generatedAt:new Date().toISOString(),url:URL,fresh,transition};
await fs.mkdir('lab-results',{recursive:true});
await fs.writeFile('lab-results/mantra37-ny-regional-profile.json',JSON.stringify(report,null,2));
console.log('M37_FRESH_NY '+JSON.stringify({published:fresh.published,elapsedMs:fresh.elapsedMs,hot:fresh.hot.slice(0,12),final:fresh.final}));
console.log('M37_TRANSITION_NY '+JSON.stringify({vtPublished:transition.vt.published,property:transition.property,nyPublished:transition.ny.published,elapsedMs:transition.ny.elapsedMs,hot:transition.ny.hot.slice(0,12),final:transition.ny.final}));
await browser.close();
