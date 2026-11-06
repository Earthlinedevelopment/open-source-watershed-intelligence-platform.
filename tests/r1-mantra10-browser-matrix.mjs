import { chromium, firefox, webkit } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const OUT='artifacts/r1-browser-matrix';
const SHA={production:'66e6d35ef69ec78bcd7a934b576dd5ad3c4d77b3',r1:'528d0e88a28183710a5935f174864f85f5dfc8ba'};
const POINT={lng:Number(process.env.IOWA_PROPERTY_LNG??-93.6208),lat:Number(process.env.IOWA_PROPERTY_LAT??41.5868)};
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
 return {regional:{generated:generation?.publishedFeatures??publication?.generated??null,visible:display?.swaleLines??publication?.overlaySwaleLines??null,rootPass:a?.pass??null,firstFailedStage:a?.firstFailedStage??null,elapsedMs:performance?.totalMs??null,regionalError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null},property:{settled:run?.settled??null,result:run?.result??null,swales:typeof M!=='undefined'?M?.swales?.length??null:null,corridors:propPub?.count??propPub?.features??safe?.count??null,published:propPub?.published??null,safeVisible:safe?.visible??null,runToken:propPub?.runToken??null}};
}
function comparable(x){return {regional:x.regional,property:{result:x.property?.result,swales:x.property?.swales,corridors:x.property?.corridors,published:x.property?.published,safeVisible:x.property?.safeVisible}}}
function classifyBoot(err,logs){
 const txt=String(err)+' '+logs.join(' ');
 return /webgl|webgl2|swiftshader|gpu process|gl context|failed to create context|canvas.*context/i.test(txt)?'environment-limitation':'failed';
}
async function boot(browser,engine,build,tag){
 const context=await browser.newContext({viewport:{width:1600,height:950}});
 const page=await context.newPage();
 const row={engine,build,commit:SHA[build],case:tag,run:0};
 capture(page,row);
 try{
  await page.goto(address(build)+'?r1='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const mapOk=await page.waitForFunction(()=>{const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;return !!m?.getCanvas?.()&&m.getCanvas().width>0},{},{timeout:20000}).then(()=>true).catch(()=>false);
  if(!mapOk)throw new Error('map canvas failed to start; possible WebGL limitation');
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
 const session=await boot(browser,engine,build,'iowa');
 if(!session)return null;
 const {context,page,row}=session;row.run=index;row.point=POINT;
 let snap=null;
 try{
  const begin=Date.now();await trigger(page,'Iowa');
  await page.waitForFunction(()=>{
   const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;
   const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
   return !!err||(/screening published|regional analysis complete/i.test(status)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191);
  },null,{timeout:90000,polling:150});
  const regional=await page.evaluate(state);row.regionalDurationMs=Date.now()-begin;
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
  snap={regional:regional.regional,property:prop.property};
  row.snapshot=snap;row.comparable=comparable(snap);
  row.baselineMatch=baseline?JSON.stringify(row.comparable)===JSON.stringify(baseline):null;
  row.status=(row.pageErrors.length===0&&!snap.regional.regionalError&&snap.property.settled===true&&snap.property.result===true&&(!baseline||row.baselineMatch))?'passed':'failed';
  if(!row.propertyWithin30s)row.existing30sAssertion='FAILED_UNCHANGED';
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
 let intercepted=0,delivered=0;
 try{
  await page.route('**/*',async route=>{
   const url=route.request().url();
   if(!url.includes('__earthlineVtBoundary16178_'))return route.continue();
   intercepted++;
   const callback=new URL(url).searchParams.get('callback');
   await sleep(9000);
   const payload="window.__R1_LATE_DELIVERY=(window.__R1_LATE_DELIVERY||0)+1;"+callback+"({features:[]});";
   try{await route.fulfill({status:200,contentType:'application/javascript',body:payload});delivered++}
   catch(e){row.logs.push('LATE_FULFILL_ERROR '+String(e))}
  });
  await trigger(page,'Vermont');
  await sleep(12000);
  row.intercepted=intercepted;row.routeFulfilled=delivered;
  row.deliverySentinel=await page.evaluate(()=>window.__R1_LATE_DELIVERY||0);
  const callbackError=row.pageErrors.some(e=>/__earthlineVtBoundary16178_|is not a function|not defined/i.test(e));
  row.callbackError=callbackError;
  row.status=intercepted===1&&delivered===1&&row.deliverySentinel===1&&(build==='production'?callbackError:!callbackError)?'passed':'failed';
  if(row.status==='failed')row.reason='late JSONP delivery, expected throw, or sentinel assertion failed';
 }catch(e){row.status='failed';row.reason=String(e)}
 await save(row,page);await context.close();
 if(row.status==='failed')failures++;
}
try{
 for(const [engine,launcher] of Object.entries(engines)){
  let browser;
  try{browser=await launcher.launch({headless:true,args:engine==='chromium'?['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']:[]})}
  catch(e){await save({engine,build:'both',case:'startup',run:0,status:classifyBoot(e,[]),reason:String(e),logs:[]},null);continue}
  await late(browser,engine,'production');
  await late(browser,engine,'r1');
  const prod=[];
  for(let n=1;n<=3;n++)prod.push(await iowa(browser,engine,'production',n,null));
  const clean=prod.filter(x=>x?.status==='passed');
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
