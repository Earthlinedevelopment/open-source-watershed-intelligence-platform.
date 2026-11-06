import {chromium,webkit} from 'playwright';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const engine=process.env.R2A_ENGINE||'chromium',launch={chromium,webkit}[engine];
if(!launch)throw Error('Unknown browser '+engine);
const dir='artifacts/r2a/'+engine,sha=b=>createHash('sha256').update(b).digest('hex');
await mkdir(dir,{recursive:true});
const bytes={r1:await readFile('ci-builds/r1/index.html'),r2a:await readFile('ci-builds/r2a/index.html')};
const identity=Object.fromEntries(Object.entries(bytes).map(([k,v])=>[k,{bytes:v.length,sha256:sha(v)}]));
if(bytes.r1.includes(Buffer.from('EARTHLINE R2a'))||!bytes.r2a.includes(Buffer.from('EARTHLINE R2a')))throw Error('INVALID_BUILD_MARKERS');
const GOLD={generated:40,processedPaths:28,drawn:0,pills:11,propertyCorridors:57},rows=[];
function measure(){
 const visible=el=>{
  for(let n=el;n&&n.nodeType===1;n=n.parentElement){
   const s=getComputedStyle(n);
   if(s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse'||Number(s.opacity)===0)return false;
  }
  const r=el.getBoundingClientRect();
  return r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.left<innerWidth&&r.top<innerHeight;
 };
 const root=document.getElementById('earthlineRegionalVectorOverlay16020');
 return {
  drawn:root?[...root.querySelectorAll('path.earthline-swale-core-16168')].filter(visible).length:0,
  pills:root?[...root.querySelectorAll('g.earthline-swale-label-16149')].filter(visible).length:0,
  generated:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated??null,
  processedPaths:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040?.swaleLines??null,
  audit:window.EARTHLINE_R2A_VISIBLE_COUNT_AUDIT||null,
  statusText:document.getElementById('earthlineVermontStatus16147')?.textContent||''
 };
}
async function trigger(page,q){await page.evaluate(s=>{const x=document.getElementById('searchInput'),b=document.getElementById('runBtn');if(!x||!b)throw Error('controls absent');x.value=s;x.dispatchEvent(new Event('input',{bubbles:true}));x.dispatchEvent(new Event('change',{bubbles:true}));b.click()},q)}
async function test(browser,build,n){
 const row={engine,build,run:n,golden:GOLD,errors:[],startedAt:new Date().toISOString()};
 const context=await browser.newContext({viewport:{width:1800,height:1000},serviceWorkers:'block'});
 const page=await context.newPage();let hits=0;
 page.on('pageerror',e=>row.errors.push(String(e)));
 await page.route('**/*',async route=>{
  const r=route.request();
  if(r.isNavigationRequest()&&r.resourceType()==='document'){
   const u=new URL(r.url());if(u.origin!=='https://earthlinedevelopment.org'||u.pathname!=='/')return route.abort();
   hits++;return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:bytes[build],headers:{'x-r2a-build':build,'cache-control':'no-store'}});
  }
  return route.continue();
 });
 try{
  const response=await page.goto('https://earthlinedevelopment.org/?r2a='+engine+'-'+build+'-'+n,{waitUntil:'domcontentloaded',timeout:60000});
  const data=await response.body();
  row.browserReceived={sha256:sha(data),expected:identity[build].sha256,bytes:data.length,hits,header:response.headers()['x-r2a-build']};
  if(row.browserReceived.sha256!==identity[build].sha256||hits!==1||row.browserReceived.header!==build)throw Error('DOCUMENT_IDENTITY_FAILURE');
  await page.waitForSelector('#searchInput',{timeout:30000});
  await trigger(page,'Iowa state');
  await page.waitForFunction(()=>{
   const t=document.getElementById('earthlineVermontStatus16147')?.textContent||'';
   return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published|regional analysis complete/i.test(t)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191);
  },null,{timeout:engine==='webkit'?180000:120000,polling:150});
  row.counts=await page.evaluate(measure);
  row.regionalError=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
  const c=row.counts,a=c.audit;
  row.domPass=c.generated===40&&c.processedPaths===28&&c.drawn===0&&c.pills===11;
  row.auditPass=!!a&&a.generated?.value===40&&a.qualified?.value===null&&a.drawn?.value===c.drawn&&a.pills?.value===c.pills&&a.processedPaths?.value===28;
  row.statusPass=/Corridor lines are not drawn at this scale\./.test(c.statusText);
  row.status=build==='r1'?(row.domPass&&!row.auditPass&&!row.statusPass?'baseline-fails-as-required':'invalid-baseline'):
    row.domPass&&row.auditPass&&row.statusPass&&row.errors.length===0&&!row.regionalError?'candidate-display-pass':'candidate-failed';
  // Collect Property and re-entry without weakening the original 30-second thresholds.
  try{
   const prepared=await page.evaluate(async()=>{
    if(typeof M==='undefined'||typeof window.earthlineSelectedSiteFromCenter!=='function'||typeof window.applyLocation!=='function'||typeof window.earthlineSetPropertyTarget16201!=='function')return false;
    const p={lng:-93.38977,lat:41.95715},site=window.earthlineSelectedSiteFromCenter(M.loc||null,p.lng,p.lat,20);
    if(!site||!await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false}))return false;
    return !!window.earthlineSetPropertyTarget16201({...p,source:'r2a-test'},{openPanel:false});
   });
   row.propertyPrepared=prepared;
   if(prepared){
    const started=Date.now();
    await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());
    await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:engine==='webkit'?180000:120000});
    row.propertyMs=Date.now()-started;
    row.property30sPass=row.propertyMs<=30000;
    row.propertyCorridors=await page.evaluate(()=>window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220?.count??null);
    await page.evaluate(()=>{window.__R2A_OLD_PERF=window.EARTHLINE_REGIONAL_PERFORMANCE_16191});
    const again=Date.now();await trigger(page,'Iowa state');
    await page.waitForFunction(()=>{const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191;return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||!!(p&&p!==window.__R2A_OLD_PERF)},null,{timeout:engine==='webkit'?180000:120000});
    row.regional2Ms=Date.now()-again;row.regional2Within30s=row.regional2Ms<=30000;
    row.reentry=await page.evaluate(measure);
   }
  }catch(e){row.propertyOrReentryError=String(e)}
 }catch(e){row.status='invalid-run';row.reason=String(e)}
 rows.push(row);
 await writeFile(dir+'/'+build+'-'+n+'.json',JSON.stringify(row,null,2));
 try{await page.screenshot({path:dir+'/'+build+'-'+n+'.png',timeout:10000})}catch{}
 await context.close();
 console.log('R2A_ROW '+JSON.stringify({engine,build,n,status:row.status,identity:row.browserReceived,counts:row.counts,property:row.propertyCorridors,reentryMs:row.regional2Ms}));
}
let browser;
try{
 browser=await launch.launch({headless:true,args:engine==='chromium'?['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']:[]});
 for(const build of ['r1','r2a'])for(let i=1;i<=3;i++)await test(browser,build,i);
}finally{if(browser)await browser.close()}
const baseline=rows.filter(x=>x.build==='r1'),candidate=rows.filter(x=>x.build==='r2a');
const summary={identity,engine,golden:GOLD,baselineDefectReproduced:baseline.every(x=>x.status==='baseline-fails-as-required'),candidateDisplayPass:candidate.every(x=>x.status==='candidate-display-pass'),rows};
await writeFile(dir+'/summary.json',JSON.stringify(summary,null,2));
console.log('R2A_SUMMARY '+JSON.stringify({engine,baselineDefectReproduced:summary.baselineDefectReproduced,candidateDisplayPass:summary.candidateDisplayPass}));
if(!summary.baselineDefectReproduced||!summary.candidateDisplayPass)process.exitCode=1;
