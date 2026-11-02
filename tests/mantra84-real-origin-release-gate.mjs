import { chromium, webkit, devices } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/candidate-mantra84/';
const TARGET={lng:-73.012909,lat:44.513845,label:'61 Sleepy Hollow Rd, Essex, Vermont, USA'};
const CRITICAL=['Arizona','Vermont','Arkansas','Iowa','Texas','Florida','California','Oklahoma'];
const results={generatedAt:null,url:URL,regionalCritical:[],clientMatrix:[],propertySequence:null};

function attach(page){
  const errors=[];
  page.on('pageerror',e=>errors.push({type:'pageerror',message:String(e)}));
  page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()})});
  return errors;
}
async function openPage(browser,contextOptions={}){
  const context=await browser.newContext(contextOptions);
  const page=await context.newPage(),errors=attach(page);
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  return {context,page,errors};
}
async function regional(page,errors,query,limitMs){
  const started=Date.now(),errorStart=errors.length;
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');if(!i||!b)throw new Error('search controls unavailable');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
  let timeout=false;
  try{
    await page.waitForFunction(q=>{
      if(window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970)return true;
      const st=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
      const g=window.EARTHLINE_REGIONAL_GEOMETRY_M84||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
      return /screening published|regional analysis complete/i.test(st)&&!!g&&!!p;
    },query,{timeout:75000,polling:150});
  }catch(_){timeout=true}
  const elapsedMs=Date.now()-started;
  const snap=await page.evaluate(()=>{
    const g=window.EARTHLINE_REGIONAL_GEOMETRY_M84||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    let sourceData=null;
    try{const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;const src=m?.getSource?.('el-live-swales-15970');sourceData=src?._data||src?.serialize?.()?.data||null;}catch(_){}
    const features=Array.isArray(sourceData?.features)?sourceData.features:[];
    const slopes=features.map(f=>Number(f?.properties?.slope_pct)).filter(Number.isFinite);
    const maxSlope=slopes.length?Math.max(...slopes):null;
    return {geometry:g,perf,generation:gen,publication:pub,display,maxSlope,sourceFeatures:features.length,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1000)};
  });
  const geometryPass=!!snap.geometry&&Number(snap.geometry.accepted)>0&&Number(snap.geometry.maxLengthM)<=4005;
  const slopePass=snap.maxSlope==null?true:Number(snap.maxSlope)<=4.0001;
  const publishPass=Number(snap.generation?.publishedFeatures||snap.sourceFeatures||0)>0;
  const pass=!timeout&&!snap.lastError&&elapsedMs<=limitMs&&geometryPass&&slopePass&&publishPass&&errors.slice(errorStart).filter(e=>e.type==='pageerror').length===0;
  return {query,pass,timeout,elapsedMs,limitMs,geometryPass,slopePass,publishPass,snap,errors:errors.slice(errorStart,errorStart+20)};
}
async function prepareProperty(page){
  return await page.evaluate(async target=>{
    if(typeof M==='undefined')return {ok:false,reason:'M unavailable'};
    if(typeof window.earthlineSelectedSiteFromCenter!=='function'||typeof window.applyLocation!=='function'||typeof window.earthlineSetPropertyTarget16201!=='function')return {ok:false,reason:'Property APIs unavailable'};
    const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,target.lng,target.lat,20);
    const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false,reason:'applyLocation rejected fixed Property site'};
    await new Promise(r=>setTimeout(r,1800));
    const set=window.earthlineSetPropertyTarget16201({lng:target.lng,lat:target.lat,source:'mantra84-release-gate'},{openPanel:false});
    return {ok:!!set};
  },TARGET);
}
async function propertyRun(page,errors,label){
  const prep=await prepareProperty(page);
  if(!prep.ok)return {label,pass:false,prep};
  const errorStart=errors.length,started=Date.now();
  let callError=null;
  try{await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());}catch(e){callError=String(e)}
  let timeout=false;
  try{
    await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return a.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';},null,{timeout:35000,polling:150});
  }catch(_){timeout=true}
  try{
    await page.waitForFunction(()=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;return !!e&&!['property-pending','loading'].includes(String(e.state||''));},null,{timeout:20000,polling:200});
  }catch(_){}
  const elapsedMs=Date.now()-started;
  const snap=await page.evaluate(()=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    const safety=(typeof M!=='undefined'&&M?.safetyAudit15806)||null;
    const lock=(typeof M!=='undefined'&&M?.propertyResultLock15815)||null;
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
    const api=window.EARTHLINE_ELDER_TREES_V1_17097||null;
    const elder=api?.summary?.()||null,features=api?.features?.()||[];
    const swales=Array.isArray(M?.swales)?M.swales:[];
    const slopeVals=swales.flatMap(x=>[x?.slopePct,x?.slope_pct,x?.slope]).map(Number).filter(Number.isFinite);
    return {audit:a,safety,lock,displayedTier:String(d.tier||d.mode||''),center:a.center||null,swales:swales.length,maxSlope:slopeVals.length?Math.max(...slopeVals):null,elder,elderFeatures:features.length,elderLast:window.EARTHLINE_ELDER_TREE_LAST_17097||null,elderRechargeWeight:api?.rechargeWeight,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1200)};
  });
  const centerPass=Math.abs(Number(snap.center?.lng)-TARGET.lng)<1e-5&&Math.abs(Number(snap.center?.lat)-TARGET.lat)<1e-5;
  const safetyPass=snap.safety?.verified===true&&snap.lock?.safetyVerified===true;
  const slopePass=snap.maxSlope==null?true:snap.maxSlope<=4.0001;
  const elderPass=Number(snap.elder?.total||snap.elderFeatures||0)>0&&Number(snap.elderRechargeWeight)===0&&!/failed/i.test(String(snap.elderLast?.state||''));
  const pass=!callError&&!timeout&&elapsedMs<=30000&&snap.audit?.settled===true&&snap.audit?.result===true&&snap.swales>0&&centerPass&&safetyPass&&slopePass&&elderPass&&errors.slice(errorStart).filter(e=>e.type==='pageerror').length===0;
  return {label,pass,callError,timeout,elapsedMs,centerPass,safetyPass,slopePass,elderPass,snap,errors:errors.slice(errorStart,errorStart+20)};
}

const chromiumBrowser=await chromium.launch({headless:true});
{
  const {context,page,errors}=await openPage(chromiumBrowser,{viewport:{width:1440,height:1000}});
  for(const q of CRITICAL){results.regionalCritical.push(await regional(page,errors,q,45000));}
  await context.close();
}
const profiles=[
  {name:'desktop-chromium',engine:'chromium',options:{viewport:{width:1440,height:1000}},limit:45000},
  {name:'pixel-chromium',engine:'chromium',options:{...devices['Pixel 7']},limit:50000},
  {name:'desktop-webkit',engine:'webkit',options:{viewport:{width:1440,height:1000}},limit:60000},
  {name:'iphone-webkit',engine:'webkit',options:{...devices['iPhone 15']},limit:60000}
];
const webkitBrowser=await webkit.launch({headless:true});
for(const p of profiles){
  const browser=p.engine==='webkit'?webkitBrowser:chromiumBrowser;
  const {context,page,errors}=await openPage(browser,p.options);
  for(const q of ['Vermont','Arizona']){const row=await regional(page,errors,q,p.limit);row.profile=p.name;results.clientMatrix.push(row);}
  await context.close();
}
{
  const {context,page,errors}=await openPage(chromiumBrowser,{viewport:{width:1440,height:1000}});
  const first=await propertyRun(page,errors,'Property 1');
  const mid=await regional(page,errors,'Vermont',45000);
  const second=await propertyRun(page,errors,'Property 2 after Regional');
  results.propertySequence={first,regional:mid,second,pass:first.pass&&mid.pass&&second.pass};
  await context.close();
}
await chromiumBrowser.close();await webkitBrowser.close();
results.generatedAt=new Date().toISOString();
const criticalPass=results.regionalCritical.every(r=>r.pass);
const clientPass=results.clientMatrix.every(r=>r.pass);
const propertyPass=results.propertySequence?.pass===true;
results.summary={criticalPass,clientPass,propertyPass,pass:criticalPass&&clientPass&&propertyPass,criticalFailed:results.regionalCritical.filter(r=>!r.pass).map(r=>r.query),clientFailed:results.clientMatrix.filter(r=>!r.pass).map(r=>r.profile+':'+r.query),propertyFailed:propertyPass?[]:[results.propertySequence?.first?.pass?'':'Property 1',results.propertySequence?.regional?.pass?'':'Regional transition',results.propertySequence?.second?.pass?'':'Property 2'].filter(Boolean)};
await fs.mkdir('artifacts/mantra84-release-gate',{recursive:true});
await fs.writeFile('artifacts/mantra84-release-gate/results.json',JSON.stringify(results,null,2));
console.log('MANTRA84_RELEASE_GATE '+JSON.stringify(results.summary));
if(!results.summary.pass)process.exitCode=1;
