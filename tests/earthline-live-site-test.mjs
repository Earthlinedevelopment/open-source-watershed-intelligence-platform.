// Earthline LIVE SITE TEST — read-only. Visits the public site exactly as a visitor would.
// Changes nothing on the site or in the repository's live branch.
// Usage: EARTHLINE_PROFILE=desktop-chrome node tests/earthline-live-site-test.mjs
import {chromium,firefox,webkit,devices} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';

const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const PROFILE=process.env.EARTHLINE_PROFILE||'desktop-chrome';
const PROFILES={
  'desktop-chrome': {engine:chromium,ctx:{viewport:{width:1440,height:900}}},
  'desktop-firefox':{engine:firefox, ctx:{viewport:{width:1440,height:900}}},
  'desktop-safari': {engine:webkit,  ctx:{viewport:{width:1440,height:900}}},
  'iphone':         {engine:webkit,  ctx:{...devices['iPhone 14']}},
  'android':        {engine:chromium,ctx:{...devices['Pixel 7']}},
};
const REGIONAL=[];
const PROPERTY=[
  {name:'ny-42-78781-75-76996',q:'42.78781, -75.76996',at:[-75.76996,42.78781]},
];
const OUT='elder-ny-results/'+PROFILE;
mkdirSync(OUT,{recursive:true});
const prof=PROFILES[PROFILE];
if(!prof){console.error('unknown profile '+PROFILE);process.exit(2);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const rows=[];

// Runs inside the page: one snapshot of everything a visitor would be looking at.
function snap(){
  const hav=(a,b)=>{const R=6371008.8,r=Math.PI/180,p1=a[1]*r,p2=b[1]*r,dp=(b[1]-a[1])*r,dl=(b[0]-a[0])*r;
    const q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));};
  const m=(typeof M!=='undefined'&&M)||null;
  let map=null;try{map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null;}catch(_){}
  const srcCount=id=>{try{const s=map&&map.getSource&&map.getSource(id);const d=s&&(s._data||(s.serialize&&s.serialize().data));
    return d&&Array.isArray(d.features)?d.features.length:null;}catch(_){return null;}};
  let swales=[];
  try{const fc=typeof earthlineSwaleGeoJSON==='function'?earthlineSwaleGeoJSON():null;
    swales=((fc&&fc.features)||[]).filter(f=>f&&f.geometry&&/LineString/.test(f.geometry.type)).map(f=>{
      const c=f.geometry.type==='LineString'?f.geometry.coordinates:(f.geometry.coordinates[0]||[]);
      let len=0;for(let i=1;i<c.length;i++)len+=hav(c[i-1],c[i]);
      const p=f.properties||{};
      return {id:p.id||p.label||null,lengthM:Math.round(len*10)/10,slopePct:Number(p.slope_pct??p.slope??p.mean_slope_pct)};
    });}catch(e){swales=[{error:String(e)}];}
  let elder=null;
  try{const e=window.EARTHLINE_ELDER_TREE_LAST_17097;
    if(e){elder={};for(const k of Object.keys(e)){const v=e[k];
      elder[k]=Array.isArray(v)?('array:'+v.length):(v&&typeof v==='object'?'object':v);}}}catch(_){}
  const de=document.documentElement,vis=id=>{const el=document.getElementById(id);if(!el)return null;
    const b=el.getBoundingClientRect(),cs=getComputedStyle(el);
    return {shown:cs.display!=='none'&&cs.visibility!=='hidden'&&b.width>1&&b.height>1,
      insideScreen:b.left>=-1&&b.top>=-1&&b.right<=innerWidth+1&&b.bottom<=innerHeight+1,
      w:Math.round(b.width),h:Math.round(b.height)};};
  const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  return {
    tier:de.dataset.earthlineAnalysisTier||null,
    runState:de.dataset.earthlineRunState||null,
    propertyRunState:de.dataset.earthlinePropertyRunState||null,
    location:m&&m.loc?String(m.loc.name||''):null,
    center:m?{lat:Number(m.centerLat),lng:Number(m.centerLng)}:null,
    analysisReady:!!(m&&m.analysisReady),
    engineSwales:m&&Array.isArray(m.swales)?m.swales.length:null,
    engineSlopes:m&&Array.isArray(m.swales)?m.swales.map(w=>Number(w&&(w.slope??w.slope_pct??w.meanSlope))).filter(Number.isFinite).map(v=>Math.round(v*10)/10):[],
    shownSwales:swales.length,swales,
    rechargeTargets:m&&Array.isArray(m.rechZones)?m.rechZones.length:null,
    regionalSwaleFeatures:srcCount('el-live-swales-15970'),
    aquiferFeatures:srcCount('el-live-aquifer-15970'),
    elder,
    propertyAudit:audit?{settled:audit.settled??null,result:audit.result??null,error:audit.error?String(audit.error).slice(0,300):null}:null,
    statusText:(()=>{try{return Array.from(document.querySelectorAll('[id*="Status"],[id*="status"],[id*="Notice"]')).filter(e=>!/^(STYLE|SCRIPT)$/.test(e.tagName)&&e.getBoundingClientRect().width>1).map(e=>e.textContent.trim().replace(/\s+/g,' ')).filter(Boolean).join(' | ').slice(0,500);}catch(_){return null;}})(),
    regionalError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970?String(window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970).slice(0,300):null,
    layout:{screen:[innerWidth,innerHeight],pageWiderThanScreen:de.scrollWidth>innerWidth+2,
      searchBox:vis('searchInput'),runButton:vis('runBtn'),propertyButton:vis('earthlineDeclareProperty16169'),
      mapCanvas:!!document.querySelector('.mapboxgl-canvas'),
      searchDirectlyBelowLogo:(()=>{const h=document.getElementById('earthlinePanelBrand16201'),l=h&&h.querySelector(':scope > .brand'),q=document.getElementById('earthlineSearchSection16188');return !!(h&&l&&q&&q.parentElement===h&&q.previousElementSibling===l);})()},
  };
}
async function typeAndRun(page,q){
  await page.evaluate(query=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    if(!i||!b)throw Error('search box or Run button missing');
    i.value=query;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},q);
}
// Watches the aquifer layer while a Regional run is in progress: counts every time it goes from filled to empty.
async function watchAquifer(page,ms){
  let last=null,blanks=0,max=0,samples=0,seenEmpty=false,refilled=false,midRun=0;const end=Date.now()+ms;
  while(Date.now()<end){
    let n=null;try{n=await page.evaluate(()=>{try{const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
      const s=map&&map.getSource&&map.getSource('el-live-aquifer-15970');const d=s&&(s._data||(s.serialize&&s.serialize().data));
      return d&&Array.isArray(d.features)?d.features.length:null;}catch(_){return null;}});}catch(_){}
    samples++;if(n!=null){if(last>0&&n===0){blanks++;if(refilled)midRun++;}if(n===0)seenEmpty=true;if(n>0&&(seenEmpty||last===null||last===0))refilled=true;if(n>max)max=n;last=n;}
    await sleep(250);
  }
  return {samples,maxFeatures:max,timesWentBlank:blanks,blankedAfterRefillThisRun:midRun,endedWith:last};
}
async function open(browser){
  const ctx=await browser.newContext(prof.ctx);const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+String(e).slice(0,300)));
  page.on('requestfailed',req=>{if(/chmv2|pyodide|jsdelivr|earthline-elder/.test(req.url()))errors.push('requestfailed: '+req.url().slice(0,220)+' '+String(req.failure()?.errorText||''));});
  page.on('response',resp=>{if(resp.status()>=400&&/chmv2|pyodide|jsdelivr|earthline-elder/.test(resp.url()))errors.push('HTTP '+resp.status()+': '+resp.url().slice(0,220));});
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text().slice(0,300));});
  await page.goto(BASE+'?livetest='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000,state:'attached'});
  await sleep(4000);
  return {ctx,page,errors};
}
async function shot(page,name){try{await page.screenshot({path:OUT+'/'+name+'.png'});}catch(_){}}

async function regional(browser,q){
  const row={kind:'regional',query:q,profile:PROFILE};const t=Date.now();let h=null;
  try{
    h=await open(browser);row.before=await h.page.evaluate(snap);
    for(const run of [1,2]){
      const t0=Date.now();await typeAndRun(h.page,q);
      const watch=await watchAquifer(h.page,run===1?45000:30000);
      let finished=false;const f0=Date.now();
      while(Date.now()-f0<105000){finished=await h.page.evaluate(()=>{const b=document.getElementById('runBtn');return !!b&&!/deriving|loading|running/i.test(b.textContent||'');});if(finished)break;await sleep(1000);}
      const s=await h.page.evaluate(snap);
      row['run'+run]={seconds:Math.round((Date.now()-t0)/100)/10,finished,aquiferWatch:watch,
        tier:s.tier,location:s.location,regionalSwaleFeatures:s.regionalSwaleFeatures,aquiferFeatures:s.aquiferFeatures,
        elder:s.elder,regionalError:s.regionalError,layout:s.layout};
      await shot(h.page,'regional-'+q.toLowerCase()+'-run'+run);
    }
  }catch(e){row.couldNotRun=String(e).slice(0,400);}
  row.pageErrors=h?h.errors.slice(0,15):[];row.totalSeconds=Math.round((Date.now()-t)/1000);
  if(h)await h.ctx.close().catch(()=>{});
  rows.push(row);console.log('EARTHLINE_LIVE_TEST '+JSON.stringify(row));
}
async function propertyOnce(page,pressNow){
  // After the search: if the site shows the Property button, press it (as a visitor would); then wait for Property to settle.
  const t0=Date.now();let pressed=false,timedOut=false,clickKind=null;
  const end=Date.now()+75000;
  while(Date.now()<end){
    const st=await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};const de=document.documentElement;
      const bv=!!b&&getComputedStyle(b).display!=='none'&&!b.disabled&&b.getBoundingClientRect().width>1;
      return {button:bv,readyClass:de.classList.contains('earthline-property-ready-16188'),settled:a.settled===true,state:String(de.dataset.earthlinePropertyRunState||''),
        ready:(typeof M!=='undefined'&&M&&M.analysisReady&&de.dataset.earthlineAnalysisTier==='property')};});
    if(pressed&&st.settled&&st.state!=='running')break;
    if(!pressed&&st.ready&&st.state!=='running'&&Date.now()-t0>6000)break; // site went straight to Property
    if(!pressed&&st.button&&(pressNow||st.readyClass||Date.now()-t0>20000)){ // wait for the site to offer Property; after 20 s press anyway and record it
      try{await page.click('#earthlineDeclareProperty16169',{timeout:5000});clickKind='real click';}catch(_){await page.evaluate(()=>document.getElementById('earthlineDeclareProperty16169').click());clickKind='real click failed, scripted click used';}
      pressed=true;}
    await sleep(300);
  }
  if(Date.now()>=end)timedOut=true;
  await sleep(2500); // let the map finish drawing
  const s=await page.evaluate(snap);
  // Wait for Elder worker completion, not merely a non-null provisional/pending state.
  const e0=Date.now();let elder=null,elderDiagnostic=null;
  const elderTimeline=[];
  while(Date.now()-e0<120000){
    elderDiagnostic=await page.evaluate(()=>{
      const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      const src=m?.getSource?.('earthline-elder-trees-17097');
      const d=src?._data||(src?.serialize?.().data);
      const featureCount=Array.isArray(d?.features)?d.features.length:null;
      const api=window.EARTHLINE_ELDER_TREES_V1_17097;
      const summary=api?.summary?.()||null;
      return {state:e?.state||null,error:e?.error||null,propertyRunIdentity:e?.propertyRunIdentity||null,
        featureCount:e?.featureCount??null,workerResults:e?.dynamicCandidatePoolCount??null,
        mapPublished:e?.mapPublished??null,sourceFeatures:featureCount,
        gauge:document.getElementById('earthlineElderTreesGauge17097')?.textContent||null,
        summaryTotal:summary?.total??null,coverageKnown:summary?.coverageKnown??null};
    });
    if(elderTimeline.length===0||JSON.stringify(elderTimeline.at(-1).status)!==JSON.stringify(elderDiagnostic))
      elderTimeline.push({elapsedSeconds:Math.round((Date.now()-e0)/1000),status:elderDiagnostic});
    if(['committed','failed','publication-pending'].includes(elderDiagnostic?.state))break;
    await sleep(3000);
  }
  elder=await page.evaluate(()=>window.EARTHLINE_ELDER_TREE_LAST_17097||null);
  const sl=(s.engineSlopes&&s.engineSlopes.length)?s.engineSlopes:s.swales.filter(x=>Number.isFinite(x.slopePct)).map(x=>x.slopePct),ln=s.swales.filter(x=>Number.isFinite(x.lengthM)).map(x=>x.lengthM);
  return {seconds:Math.round((Date.now()-t0)/100)/10,propertyButtonPressed:pressed,clickKind,timedOut,
    tier:s.tier,location:s.location,center:s.center,analysisReady:s.analysisReady,
    engineSwales:s.engineSwales,shownSwales:s.shownSwales,slopesMeasured:sl.length,statusText:s.statusText,
    steepestSwalePct:sl.length?Math.max(...sl):null,swalesOver4pct:sl.filter(v=>v>4.0001).length,
    shortestSwaleM:ln.length?Math.min(...ln):null,longestSwaleM:ln.length?Math.max(...ln):null,
    rechargeTargets:s.rechargeTargets,elder,elderDiagnostic,elderTimeline,elderWaitSeconds:Math.round((Date.now()-e0)/1000),
    propertyAudit:s.propertyAudit,layout:s.layout,swales:s.swales};
}
async function property(browser,site){
  const row={kind:'property',site:site.name,query:site.q,profile:PROFILE};const t=Date.now();let h=null;
  try{
    h=await open(browser);
    for(const run of [1,2]){ // run 1 = first click on a fresh page; run 2 = same search again on the same page
      if(site.at){ // move the map so the crosshair sits on the coordinate, as a visitor does by dragging
        row.reachedBy='map moved to coordinate';
        await h.page.evaluate(c=>{const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
          if(!map)throw Error('map not available');map.jumpTo({center:c,zoom:17});},site.at);
        await sleep(5000);
      }else{row.reachedBy='address typed in search';await typeAndRun(h.page,site.q);}
      row['run'+run]=await propertyOnce(h.page,!!site.at);
      await shot(h.page,'property-'+site.name+'-run'+run);
    }
    const a=row.run1,b=row.run2;
    row.sameResultBothRuns=!!(a&&b&&a.shownSwales===b.shownSwales&&JSON.stringify(a.swales)===JSON.stringify(b.swales));
  }catch(e){row.couldNotRun=String(e).slice(0,400);}
  row.pageErrors=h?h.errors.slice(0,15):[];row.totalSeconds=Math.round((Date.now()-t)/1000);
  if(h)await h.ctx.close().catch(()=>{});
  rows.push(row);console.log('EARTHLINE_LIVE_TEST '+JSON.stringify(Object.assign({},row,{run1:row.run1&&Object.assign({},row.run1,{swales:undefined}),run2:row.run2&&Object.assign({},row.run2,{swales:undefined})})));
}

async function waitRegionalDone(page,ms){const f0=Date.now();
  while(Date.now()-f0<ms){const ok=await page.evaluate(()=>{const b=document.getElementById('runBtn');return !!b&&!/deriving|loading|running/i.test(b.textContent||'');});if(ok)return true;await sleep(1000);}return false;}
async function lifecycle(browser,q){
  const row={kind:'lifecycle',query:q,profile:PROFILE,steps:[]};const t=Date.now();let h=null;
  try{
    h=await open(browser);
    for(const round of [1,2]){
      await typeAndRun(h.page,q);const watch=await watchAquifer(h.page,20000);const finished=await waitRegionalDone(h.page,130000);await sleep(2000);
      const r=await h.page.evaluate(snap);
      row.steps.push({step:'regional '+round,finished,tier:r.tier,regionalSwaleFeatures:r.regionalSwaleFeatures,aquiferFeatures:r.aquiferFeatures,blankedAfterRefillThisRun:watch.blankedAfterRefillThisRun,regionalError:r.regionalError});
      await shot(h.page,'lifecycle-'+q.toLowerCase()+'-regional'+round);
      const pr=await propertyOnce(h.page,false);
      row.steps.push({step:'property '+round,seconds:pr.seconds,clickKind:pr.clickKind,timedOut:pr.timedOut,tier:pr.tier,analysisReady:pr.analysisReady,engineSwales:pr.engineSwales,shownSwales:pr.shownSwales,steepestSwalePct:pr.steepestSwalePct,swalesOver4pct:pr.swalesOver4pct,rechargeTargets:pr.rechargeTargets,elder:pr.elder,propertyAudit:pr.propertyAudit,center:pr.center,swales:pr.swales});
      await shot(h.page,'lifecycle-'+q.toLowerCase()+'-property'+round);
    }
    const P=row.steps.filter(x=>x.step.startsWith('property')),R=row.steps.filter(x=>x.step.startsWith('regional'));
    row.propertySameBothRounds=P.length===2&&JSON.stringify(P[0].swales)===JSON.stringify(P[1].swales);
    row.regionalSameBothRounds=R.length===2&&R[0].regionalSwaleFeatures===R[1].regionalSwaleFeatures&&R[0].aquiferFeatures===R[1].aquiferFeatures;
    for(const x of P)x.swales=undefined;
  }catch(e){row.couldNotRun=String(e).slice(0,400);}
  row.pageErrors=h?h.errors.slice(0,15):[];row.totalSeconds=Math.round((Date.now()-t)/1000);
  if(h)await h.ctx.close().catch(()=>{});
  rows.push(row);console.log('EARTHLINE_LIVE_TEST '+JSON.stringify(row));
}
let browser=null,launchError=null;
try{browser=await prof.engine.launch({headless:true});}catch(e){launchError=String(e).slice(0,400);}
if(browser){
  for(const q of REGIONAL)await regional(browser,q);
  for(const s of PROPERTY)await property(browser,s);
  // Scoped to one New York Property so final Elder worker status is observable.
  await browser.close().catch(()=>{});
}
const result={profile:PROFILE,url:BASE,testedAt:new Date().toISOString(),launchError,rows};
writeFileSync(OUT+'/results.json',JSON.stringify(result,null,1));
console.log('EARTHLINE_LIVE_TEST_DONE '+PROFILE+' rows='+rows.length+(launchError?' launchError':''));
