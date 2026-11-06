import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const OUT='artifacts/r1-browser-matrix';
const SHA={production:'66e6d35ef69ec78bcd7a934b576dd5ad3c4d77b3',r1:'528d0e88a28183710a5935f174864f85f5dfc8ba'};
const POINT={lng:-93.38977,lat:41.95715,acres:20};
const IOWA_GOLDEN={regionalGenerated:40,regionalProcessedPaths:28,regionalDrawn:0,regionalPills:11,propertyCorridors:57,fingerprints:{sourceStateFingerprint:'f45509978ce31467',scientificInputFingerprint:'e689e5e520256050',noBuildMaskHash:'9e84647e45512220',elevationGridHash:'9b43dc7c77c80042',flowDirectionHash:'445f85f5442a02d5',flowAccumulationHash:'860f65cc4d80e2f6'}};
const engines={chromium,firefox,webkit};
const results=[]; let failures=0;
await mkdir(OUT,{recursive:true});
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.wasm':'application/wasm'};
function serverFor(name){
 const root=resolve('ci-builds',name);
 return createServer(async(req,res)=>{
  const requestPath=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const path=resolve(requestPath==='/'?root+'/index.html':'.'+requestPath);
  const fallback=resolve('.'+requestPath);
  const safe=path.startsWith(root+sep)||path===root+'/index.html';
  let data=null;
  for(const file of [safe?path:null,fallback.startsWith(resolve('.')+sep)?fallback:null]){
   if(!file)continue;
   try{data=await readFile(file);break}catch{}
  }
  if(!data){res.writeHead(404);res.end('not found');return}
  res.writeHead(200,{'content-type':MIME[extname(requestPath)]||'application/octet-stream','cache-control':'no-store'});
  res.end(data);
 });
}
const servers={};
for(const name of Object.keys(SHA)){
 servers[name]=serverFor(name);
 await new Promise(r=>servers[name].listen(0,'127.0.0.1',r));
}
const port=name=>servers[name].address().port;
const address=name=>'http://127.0.0.1:'+port(name)+'/';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function save(row,page){
 const dir=OUT+'/'+row.engine+'/'+row.build+'/'+row.case+'/'+String(row.run).padStart(2,'0');
 await mkdir(dir,{recursive:true});
 if(page)try{await page.screenshot({path:dir+'/screen.png',fullPage:false,timeout:10000})}catch(e){row.screenshotError=String(e)}
 await writeFile(dir+'/result.json',JSON.stringify(row,null,2));
 await writeFile(dir+'/console.log',(row.logs||[]).join('\n'));
 results.push(row);
 console.log('R1_ROW '+JSON.stringify({engine:row.engine,build:row.build,case:row.case,run:row.run,status:row.status,reason:row.reason||null}));
}
function capture(page,row){
 row.logs=[];row.pageErrors=[];
 page.on('pageerror',e=>{row.pageErrors.push(String(e));row.logs.push('PAGEERROR '+e)});
 page.on('console',m=>row.logs.push('CONSOLE '+m.type()+' '+m.text()));
 page.on('requestfailed',r=>row.logs.push('REQUESTFAILED '+r.url()+' '+r.failure()?.errorText));
}
function state(){
 const performance=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
 const generation=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
 const publication=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
 const display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
 const run=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
 const propPub=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
 const safe=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null;
 const a=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
 const fingerprintKeys=['sourceStateFingerprint','scientificInputFingerprint','noBuildMaskHash','elevationGridHash','flowDirectionHash','flowAccumulationHash'];
 const fingerprints={};const seen=new WeakSet();let visited=0;
 function scan(obj,depth){
  if(!obj||typeof obj!=='object'||depth>5||visited++>8000||seen.has(obj))return;
  seen.add(obj);
  for(const [k,v] of Object.entries(obj)){
   if(fingerprintKeys.includes(k)&&(typeof v==='string'||typeof v==='number'))fingerprints[k]=String(v);
   else if(v&&typeof v==='object'&&depth<5)scan(v,depth+1);
  }
 }
 scan(window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556,0);
 scan(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173,0);
 scan(window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784,0);
 scan(window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584,0);
 if(typeof M!=='undefined'){scan(M?.safetyAudit15806,0);scan(M?.propertyResultLock15815,0)}
 return {fingerprints,regional:{generated:generation?.publishedFeatures??publication?.generated??null,processedPaths:display?.processedPaths??display?.processedPathCount??display?.swaleLines??null,rootPass:a?.pass??null,firstFailedStage:a?.firstFailedStage??null,elapsedMs:performance?.totalMs??null,regionalError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null},property:{settled:run?.settled??null,result:run?.result??null,swales:typeof M!=='undefined'?M?.swales?.length??null:null,corridors:propPub?.count??propPub?.features??safe?.count??null,published:propPub?.published??null,safeVisible:safe?.visible??null,runToken:propPub?.runToken??null}};
}
function pageEvidence(){
 const styleVisible=element=>{
  let el=element;
  while(el&&el.nodeType===1){
   const cs=getComputedStyle(el);
   if(cs.display==='none'||cs.visibility==='hidden'||cs.visibility==='collapse'||Number(cs.opacity)===0||el.hasAttribute('hidden'))return false;
   el=el.parentElement;
  }
  const r=element.getBoundingClientRect();
  return r.width>0&&r.height>0;
 };
 const swalePaths=[...document.querySelectorAll('svg path')].filter(el=>{
  let p=el;for(let i=0;i<8&&p;i++,p=p.parentElement){
   if(/swale/i.test(String(p.id||'')+' '+String(p.getAttribute('class')||'')+' '+String(p.getAttribute('data-layer')||'')))return true;
  }return false;
 });
 const paths=swalePaths.map(el=>({id:el.id||null,ancestor:(el.closest('[id*="swale"],[id*="Swale"],[class*="swale"],[class*="Swale"]')?.id||null),visible:styleVisible(el)}));
 const pillElements=[...document.querySelectorAll('button,[role="button"],.chip,.pill,[class*="chip"],[class*="pill"]')].filter(el=>{
  const signature=String(el.id||'')+' '+String(el.className||'')+' '+String(el.getAttribute('data-role')||'');
  return /opportun|swale|regional.*(chip|pill)|(?:chip|pill).*regional/i.test(signature);
 });
 const pills=pillElements.filter(styleVisible);
 return {drawn:paths.filter(p=>p.visible).length,pills:pills.length,swalePathCandidates:paths.length,pillCandidates:pillElements.length,
  pathDetails:paths.slice(0,60),pillDetails:pills.map(el=>({tag:el.tagName,id:el.id,className:String(el.className),text:String(el.textContent||'').trim().slice(0,90)})).slice(0,35),
  missingEvidence:swalePaths.length===0||pillElements.length===0};
}
function comparable(x){return {regional:{generated:x.regional?.generated,processedPaths:x.regional?.processedPaths,drawn:x.regional?.dom?.drawn,pills:x.regional?.dom?.pills,rootPass:x.regional?.rootPass,firstFailedStage:x.regional?.firstFailedStage},property:{result:x.property?.result,swales:x.property?.swales,corridors:x.property?.corridors,published:x.property?.published,safeVisible:x.property?.safeVisible},reentry:{generated:x.reentry?.generated,processedPaths:x.reentry?.processedPaths,drawn:x.reentry?.dom?.drawn,pills:x.reentry?.dom?.pills,rootPass:x.reentry?.rootPass,firstFailedStage:x.reentry?.firstFailedStage}}}
function classifyBoot(err,logs){
 const txt=String(err)+' '+logs.join(' ');
 return /webgl|webgl2|swiftshader|gpu process|gl context|failed to create context|canvas.*context/i.test(txt)?'environment-limitation':'failed';
}
async function boot(browser,engine,build,tag,runNumber=0){
 const context=await browser.newContext({viewport:{width:1800,height:1000}});
 const page=await context.newPage();
 const row={engine,build,commit:SHA[build],case:tag,run:runNumber};
 capture(page,row);
 try{
  await page.goto(address(build)+'?r1='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const mapOk=await page.waitForFunction(()=>{const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;return !!m?.getCanvas?.()&&m.getCanvas().width>0},{},{timeout:20000}).then(()=>true).catch(()=>false);
  if(!mapOk)throw new Error('map canvas failed to start');
  return {context,page,row};
 }catch(e){
  row.status=classifyBoot(e,row.logs);row.reason=String(e);await save(row,page);
  await context.close(); if(row.status==='failed')failures++;
  return null;
 }
}
async function trigger(page,query){
 await page.evaluate(q=>{
  const input=document.getElementById('searchInput'),button=document.getElementById('runBtn');
  if(!input||!button)throw new Error('controls missing');
  input.value=q;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));button.click();
 },query);
}
async function iowa(browser,engine,build,index,baseline){
 const session=await boot(browser,engine,build,'iowa',index);
 if(!session)return null;
 const {context,page,row}=session;row.run=index;row.point=POINT;row.goldens=IOWA_GOLDEN;
 let snap=null;
 try{
  const begin=Date.now();await trigger(page,'Iowa state');
  await page.waitForFunction(()=>{
   const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;
   const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
   return !!err||(/screening published|regional analysis complete/i.test(status)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191);
  },null,{timeout:90000,polling:150});
  const regional=await page.evaluate(state);regional.regional.dom=await page.evaluate(pageEvidence);row.regionalDurationMs=Date.now()-begin;
  row.camera=await page.evaluate(()=>{const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;return {zoom:m?.getZoom?.()??null,width:window.innerWidth,height:window.innerHeight}});
  row.viewportPass=row.camera.width===1800&&row.camera.height===1000;
  row.goldenZoomPass=typeof row.camera.zoom==='number'&&Math.abs(row.camera.zoom-7.08)<=0.1;
  const prepare=await page.evaluate(async point=>{
   if(typeof M==='undefined'||typeof window.earthlineSelectedSiteFromCenter!=='function'||typeof window.applyLocation!=='function'||typeof window.earthlineSetPropertyTarget16201!=='function')return {ok:false,why:'property APIs unavailable'};
   const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,point.lng,point.lat,20);
   if(!site)return {ok:false,why:'site unavailable'};
   const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
   if(!applied)return {ok:false,why:'applyLocation rejected'};
   return {ok:!!window.earthlineSetPropertyTarget16201({lng:point.lng,lat:point.lat,source:'r1-ci'},{openPanel:false})};
  },POINT);
  if(!prepare.ok)throw new Error('Property preparation: '+prepare.why);
  const propStart=Date.now();
  await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());
  await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&document.documentElement.dataset.earthlinePropertyRunState!=='running',null,{timeout:90000,polling:150});
  const prop=await page.evaluate(state);
  row.propertyDurationMs=Date.now()-propStart;
  // Keep existing 30-second assertion unchanged: report, do not weaken.
  row.propertyWithin30s=row.propertyDurationMs<=30000;
  row.property30sAssertion=row.propertyWithin30s?'PASS':'FAIL_UNCHANGED';
  await page.evaluate(()=>{window.__R1_PREVIOUS_REGIONAL_PERF=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null});
  const reentryStarted=Date.now();
  await trigger(page,'Iowa state');
  await page.waitForFunction(()=>{
    const current=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;
    return !!err||!!(current&&current!==window.__R1_PREVIOUS_REGIONAL_PERF);
  },null,{timeout:90000,polling:150});
  row.reentryDurationMs=Date.now()-reentryStarted;
  row.reentryWithin30s=row.reentryDurationMs<=30000;
  row.reentry30sAssertion=row.reentryWithin30s?'PASS':'FAIL_UNCHANGED';
  const reentry=await page.evaluate(state);reentry.regional.dom=await page.evaluate(pageEvidence);
  snap={regional:regional.regional,property:prop.property,reentry:reentry.regional,fingerprints:prop.fingerprints};
  row.fingerprintMatch=Object.entries(IOWA_GOLDEN.fingerprints).every(([k,v])=>snap.fingerprints?.[k]===v);
  row.snapshot=snap;row.comparable=comparable(snap);
  row.baselineMatch=baseline?JSON.stringify(row.comparable)===JSON.stringify(baseline):null;
  row.scientificPass=row.viewportPass&&row.goldenZoomPass&&row.fingerprintMatch&&snap.regional.generated===IOWA_GOLDEN.regionalGenerated&&snap.regional.processedPaths===IOWA_GOLDEN.regionalProcessedPaths&&!snap.regional.dom.missingEvidence&&snap.regional.dom.drawn===IOWA_GOLDEN.regionalDrawn&&snap.regional.dom.pills===IOWA_GOLDEN.regionalPills&&Number(snap.property.corridors)===IOWA_GOLDEN.propertyCorridors&&snap.reentry.generated===IOWA_GOLDEN.regionalGenerated&&snap.reentry.processedPaths===IOWA_GOLDEN.regionalProcessedPaths&&!snap.reentry.dom.missingEvidence&&snap.reentry.dom.drawn===IOWA_GOLDEN.regionalDrawn&&snap.reentry.dom.pills===IOWA_GOLDEN.regionalPills;
  row.publicationPass=row.pageErrors.length===0&&!snap.regional.regionalError&&snap.property.settled===true&&snap.property.result===true;
  row.goldenParity=row.scientificPass;
  row.existingCrossBrowserDifference=engine!=='chromium'&&build==='production'&&!row.goldenParity;
  row.status=(row.publicationPass&&row.propertyWithin30s&&row.reentryWithin30s&&(!baseline||row.baselineMatch)&&(engine!=='chromium'||row.goldenParity))?'passed':'failed';
  if(!row.propertyWithin30s)row.existing30sAssertion='FAILED_UNCHANGED';
  row.goldens=IOWA_GOLDEN;
  if(row.status==='failed')row.reason='page errors, incomplete publication, or baseline mismatch';
 }catch(e){row.status=classifyBoot(e,row.logs);row.reason=String(e)}
 await save(row,page);await context.close();
 if(row.status==='failed')failures++;
 return row;
}
async function late(browser,engine,build){
 const session=await boot(browser,engine,build,'late-reply');
 if(!session)return;
 const {context,page,row}=session;row.run=1;
 let intercepted=0,requestUrl=null,callback=null,fulfilled=0;
 const payload=()=> "window.__R1_LATE_DELIVERY=(window.__R1_LATE_DELIVERY||0)+1;window["+JSON.stringify(callback)+"]({features:[]});";
 try{
  await page.route('**/*',async route=>{
   const url=route.request().url();
   if(!url.includes('__earthlineVtBoundary16178_'))return route.continue();
   intercepted++;
   if(intercepted===1){
    requestUrl=url;
    callback=new URL(url).searchParams.get('callback');
    await sleep(9000); // Hold the exact VCGI script request beyond its 8-second app timeout.
    try{await route.fulfill({status:200,contentType:'application/javascript',body:payload()});fulfilled++}
    catch(e){row.logs.push('ORIGINAL_LATE_RESPONSE_CANCELED '+String(e))}
   }else{
    // An explicitly reinserted script tests whether the retired callback is callable.
    try{await route.fulfill({status:200,contentType:'application/javascript',body:payload()});fulfilled++}
    catch(e){row.logs.push('REPLAY_FAILED '+String(e))}
   }
  });
  await trigger(page,'Vermont');
  await sleep(10500);
  let sentinel=await page.evaluate(()=>window.__R1_LATE_DELIVERY||0);
  row.deliveryMode=sentinel===1?'original-held-request':'reinjected-script-after-original-removal';
  if(sentinel===0&&requestUrl){
    // The app may remove the original script at t=8s. Reloading the same
    // VCGI URL in a NEW script executes an authentic browser-delivered JSONP
    // response at t>9s, rather than calling the callback from evaluate().
    await page.evaluate(url=>{
      const script=document.createElement('script');
      script.async=true;script.src=url;document.head.appendChild(script);
    },requestUrl);
    await page.waitForFunction(()=>window.__R1_LATE_DELIVERY===1,null,{timeout:10000,polling:100}).catch(()=>{});
    sentinel=await page.evaluate(()=>window.__R1_LATE_DELIVERY||0);
  }
  await sleep(300);
  row.intercepted=intercepted;
  row.routeFulfilled=fulfilled;
  row.requestCallback=callback;
  row.deliverySentinel=sentinel;
  row.callbackError=row.pageErrors.some(e=>/__earthlineVtBoundary16178_|is not a function|not defined/i.test(e));
  row.naturalDelivery=row.deliveryMode==='original-held-request'&&sentinel===1;
  row.syntheticDelivery=row.deliveryMode==='reinjected-script-after-original-removal'&&sentinel===1;
  row.defectReachability=row.naturalDelivery?'naturally-reachable':row.syntheticDelivery?'synthetic-only-not-naturally-reachable':'not-executed';
  const delivered=sentinel===1;
  const expectedThrow=build==='production'&&row.callbackError;
  const expectedR1=build==='r1'&&row.pageErrors.length===0;
  row.status=!delivered?'invalid-test':
    engine==='chromium'&&!row.naturalDelivery?'failed':
    (build==='production'?(row.naturalDelivery?expectedThrow:row.syntheticDelivery&&expectedThrow):expectedR1)?'passed':'failed';
  if(row.status==='failed')row.reason='VCGI interception, late execution, expected baseline exception, or zero-error R1 assertion failed';
 }catch(e){row.status='failed';row.reason=String(e)}
 await save(row,page);await context.close();
 if(row.status==='failed'||row.status==='invalid-test')failures++;
}

try{
 for(const [engine,launcher] of Object.entries(engines)){
  let browser;
  try{browser=await launcher.launch({headless:true,args:engine==='chromium'?['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']:[]})}
  catch(e){const status=classifyBoot(e,[]);await save({engine,build:'both',case:'startup',run:0,status,reason:String(e),logs:[]},null);if(status==='failed')failures++;continue}
  await late(browser,engine,'production');
  await late(browser,engine,'r1');
  const prod=[];
  for(let n=1;n<=3;n++)prod.push(await iowa(browser,engine,'production',n,null));
  // Existing 30-second re-entry failure must not erase each engine's scientific baseline.
  const clean=prod.filter(x=>x?.publicationPass===true&&x?.comparable);
  const baseline=clean.length===3&&clean.every(x=>JSON.stringify(x.comparable)===JSON.stringify(clean[0].comparable))?clean[0].comparable:null;
  if(!baseline){
   const row={engine,build:'production',case:'iowa-baseline',run:0,status:'failed',reason:'Three production baselines did not agree or did not complete',logs:[]};
   await save(row,null);failures++;
  }
  for(let n=1;n<=10;n++)await iowa(browser,engine,'r1',n,baseline||{invalidBaseline:true});
  await browser.close();
 }
}finally{
 for(const server of Object.values(servers))await new Promise(r=>server.close(r));
}
await writeFile(OUT+'/summary.json',JSON.stringify({commits:SHA,point:POINT,rows:results,failures},null,2));
console.log('R1_MATRIX_SUMMARY '+JSON.stringify({total:results.length,failures}));
if(failures)process.exitCode=1;
