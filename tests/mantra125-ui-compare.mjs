import {chromium, webkit} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const engine=process.env.ENGINE||'chromium',type={chromium,webkit}[engine];
const sha=x=>createHash('sha256').update(x).digest('hex');
const base=execFileSync('git',['show','56009ce:index.html'],{maxBuffer:16000000});
const candidate=execFileSync('git',['show','347718f:index.html'],{maxBuffer:16000000});
if(!candidate.includes(Buffer.from('getZoom()<10')))throw Error('Zoom gate absent');
for(const x of ['Hotfix 3 R3','Hotfix 3 R7','visible map label'])if(!candidate.includes(Buffer.from(x)))throw Error('Missing UI marker '+x);
await writeFile('index.html',candidate);
const root='artifacts/mantra125/'+engine;await mkdir(root,{recursive:true});
const browser=await type.launch({headless:true,args:engine==='chromium'?['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']:[]});
const context=await browser.newContext({viewport:{width:1800,height:1000},serviceWorkers:'block'});
const results={engine,baselineSha:sha(base),candidateSha:sha(candidate),runs:{}};
async function run(name,html){
 const page=await context.newPage(),errors=[],network=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('requestfailed',r=>network.push({url:r.url().slice(0,160),error:r.failure()?.errorText}));
 await page.route('**/*',route=>{
   const req=route.request();
   if(req.isNavigationRequest()&&req.resourceType()==='document')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html,headers:{'cache-control':'no-store'}});
   return route.continue();
 });
 let outcome={errors,network,steps:[]};
 try{
   const response=await page.goto('https://earthlinedevelopment.org/?mantra125='+engine+'-'+name,{waitUntil:'domcontentloaded',timeout:60000});
   outcome.receivedSha=sha(await response.body());
   await page.waitForSelector('#searchInput',{timeout:30000});
   try{await page.waitForFunction(()=>{let m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;return !!m?.jumpTo},{timeout:45000});outcome.mapReady=true}catch(e){outcome.mapReady=false;outcome.mapWaitError=String(e)}
   await page.locator('#searchInput').fill('Iowa state');
   await page.locator('#searchInput').press('Enter');
   try{await page.waitForFunction(()=>{const t=document.getElementById('earthlineVermontStatus16147')?.textContent||'';return /screening published|regional analysis complete|analysis failed/i.test(t)||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970},{timeout:engine==='webkit'?180000:120000});}catch(e){outcome.analysisWaitError=String(e)}
   for(const z of [7,11]){
     try{await page.evaluate(z=>{const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;if(!m)throw Error('No Mapbox map');let center=null;if(z>=10){const g=document.querySelector('#earthlineRegionalVectorOverlay16020 g.earthline-swale-label-16149');const cr=m.getCanvas?.().getBoundingClientRect(),r=g?.getBoundingClientRect();if(cr&&r&&r.width&&r.height){const ll=m.unproject([r.left+r.width/2-cr.left,r.top+r.height/2-cr.top]);center=[ll.lng,ll.lat]}}m.jumpTo(center?{zoom:z,center}:{zoom:z});},z);await page.waitForTimeout(1800)}
     catch(e){outcome.steps.push({zoom:z,error:String(e)});continue}
     const record=await page.evaluate(()=>{
       const host=document.getElementById('earthlineRegionalVectorOverlay16020');
       const visible=el=>{for(let p=el;p&&p.nodeType===1;p=p.parentElement){let s=getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false;}const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight};
       const paths=host?[...host.querySelectorAll('path.earthline-swale-core-16168')]:[];
       const labels=host?[...host.querySelectorAll('g.earthline-swale-label-16149')]:[];
       const chip=document.getElementById('earthlineTierNotice16173');
       const panel=document.getElementById('earthlinePanel16188');
       const legends=['earthlineSwaleLegend16050','earthlineAquiferLegend16070','earthlineDiagramLegend16080'].map(id=>{let e=document.getElementById(id);return {id,exists:!!e,visible:!!e&&visible(e)}});
       return {visiblePaths:paths.filter(visible).length,totalPaths:paths.length,visibleLabels:labels.filter(visible).length,chipVisible:!!chip?.classList.contains('visible'),chipText:chip?.textContent||'',legends,panelBackground:panel?getComputedStyle(panel).backgroundColor:null,status:document.getElementById('earthlineVermontStatus16147')?.textContent||'',regionalError:String(window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||'').slice(0,400)};
     });
     outcome.steps.push({zoom:z,...record});
     await page.screenshot({path:root+'/'+name+'-z'+z+'.png',timeout:20000});
   }
 }catch(e){outcome.error=String(e)}
 await page.close();return outcome;
}
try{
 results.runs.baseline=await run('production',base);
 results.runs.candidate=await run('restored',candidate);
 const b=results.runs.baseline,c=results.runs.candidate;
 // Compare error texts without masking genuine new exceptions. The same error
 // must occur on the baseline with equal or greater multiplicity.
 const normalize=x=>String(x);
 const counts=new Map();for(const e of b.errors){const k=normalize(e);counts.set(k,(counts.get(k)||0)+1)}
 results.newErrors=[];for(const e of c.errors){const k=normalize(e),n=counts.get(k)||0;if(n>0)counts.set(k,n-1);else results.newErrors.push(e)}
 results.checks={
  baselineIdentity:b.receivedSha===results.baselineSha,
  candidateIdentity:c.receivedSha===results.candidateSha,
  noNewPageErrors:results.newErrors.length===0,
  baselineMapReady:b.mapReady===true,
  candidateMapReady:c.mapReady===true,
  zoom7:(c.steps.find(x=>x.zoom===7)?.visiblePaths??-1)===0,
  zoom11:(c.steps.find(x=>x.zoom===11)?.visiblePaths??0)>0,
  regionalChip:c.steps.filter(x=>x.zoom===7||x.zoom===11).every(x=>x.chipVisible===false),
  labels:(c.steps.find(x=>x.zoom===7)?.visibleLabels??0)>0,
  panelOpaque:Buffer.from(candidate).includes(Buffer.from('background:#111923!important'))
 };
 results.passed=Object.values(results.checks).every(Boolean);
}finally{await browser.close()}
await writeFile(root+'/results.json',JSON.stringify(results,null,2));
console.log('MANTRA125_RESULTS '+JSON.stringify({engine,checks:results.checks,baselineErrors:results.runs.baseline?.errors,candidateErrors:results.runs.candidate?.errors,newErrors:results.newErrors,baseline:results.runs.baseline?.steps,candidate:results.runs.candidate?.steps}));
if(!results.passed)process.exitCode=1;
