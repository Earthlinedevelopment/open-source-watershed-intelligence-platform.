import {chromium,webkit} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const engine=process.env.HF3_ENGINE||'chromium';
const browserType={chromium,webkit}[engine];
if(!browserType)throw Error('Unknown engine: '+engine);
const out='artifacts/hotfix3/'+engine;
await mkdir(out,{recursive:true});
const html=await readFile('index.html');
const identity=createHash('sha256').update(html).digest('hex');
const productionRef='5bab57f';
// Resolve the exact deployed Git commit, independent of current public cache/CDN.
execFileSync('git',['fetch','--no-tags','--depth=1','origin',productionRef],{timeout:120000});
const baselineHtml=execFileSync('git',['show',productionRef+':index.html'],{maxBuffer:12*1024*1024});
const baselineSha=createHash('sha256').update(baselineHtml).digest('hex');
const result={engine,identity,productionRef,baselineSha,checks:{},pageErrors:[],consoleErrors:[],census:[],screenshots:[],startedAt:new Date().toISOString()};
const browser=await browserType.launch({headless:true,args:engine==='chromium'?['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']:[]});
const context=await browser.newContext({viewport:{width:1800,height:1000},serviceWorkers:'block'});
const page=await context.newPage();
page.on('pageerror',e=>result.pageErrors.push(String(e)));
page.on('console',msg=>{if(msg.type()==='error')result.consoleErrors.push(msg.text().slice(0,400))});
page.on('response',r=>{if(/census\.gov/i.test(r.url()))result.census.push({url:r.url().slice(0,300),status:r.status()})});
page.on('requestfailed',r=>{if(/census\.gov/i.test(r.url()))result.census.push({url:r.url().slice(0,300),error:r.failure()?.errorText||'request failed'})});
let docHits=0;
await page.route('**/*',async route=>{
 const req=route.request();
 if(req.isNavigationRequest()&&req.resourceType()==='document'){
  const u=new URL(req.url());
  if(u.origin!=='https://earthlinedevelopment.org'||u.pathname!=='/')return route.abort();
  docHits++;return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html,headers:{'x-hotfix3-candidate':'review','cache-control':'no-store'}});
 }
 return route.continue();
});
async function screenshot(name){const path=out+'/'+name+'.png';await page.screenshot({path,fullPage:false,timeout:20000});result.screenshots.push(path)}
async function trigger(query){await page.evaluate(q=>{const x=document.getElementById('searchInput'),b=document.getElementById('runBtn');if(!x||!b)throw Error('Search controls absent');x.value=q;x.dispatchEvent(new Event('input',{bubbles:true}));x.dispatchEvent(new Event('change',{bubbles:true}));b.click()},query)}
async function overlay(p=page){
 return p.evaluate(()=>{
  const root=document.getElementById('earthlineRegionalVectorOverlay16020');
  const visible=el=>{
   for(let n=el;n&&n.nodeType===1;n=n.parentElement){const c=getComputedStyle(n);if(c.display==='none'||c.visibility==='hidden'||c.visibility==='collapse'||Number(c.opacity)===0)return false}
   const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.left<innerWidth&&r.top<innerHeight
  };
  const paths=root?[...root.querySelectorAll('path.earthline-swale-core-16168')]:[];
  return {
   groupDisplay:root?getComputedStyle(root).display:null,
   totalPaths:paths.length,
   inViewPaths:paths.filter(visible).length,
   zoom:(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap)?.getZoom?.(),
   generated:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated??null,
   processedPaths:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040?.swaleLines??null,
   drawn:paths.filter(visible).length,
   pills:root?[...root.querySelectorAll('g.earthline-swale-label-16149')].filter(visible).length:0,
   status:document.getElementById('earthlineVermontStatus16147')?.textContent||'',
   body:document.body.innerText.slice(0,1000)
  }
 })
}
async function zoom(z,center){await page.evaluate(({z,center})=>{const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;if(!m)throw Error('No Mapbox map');m.jumpTo(center?{zoom:z,center}:{zoom:z})},{z,center});await page.waitForTimeout(1100)}
async function topLabelPosition(p){return p.evaluate(()=>{
 const root=document.getElementById('earthlineRegionalVectorOverlay16020');
 const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;
 if(!root||!m?.getCanvas())return null;
 const labels=[...root.querySelectorAll('g.earthline-swale-label-16149')];
 const g=labels.find(x=>/\bA1\b/.test(x.textContent||''))||labels[0];
 if(!g)return null;
 const r=g.getBoundingClientRect(),mr=m.getCanvas().getBoundingClientRect();
 const ll=m.unproject([r.left+r.width/2-mr.left,r.top+r.height/2-mr.top]);
 return {lng:ll.lng,lat:ll.lat,label:(g.textContent||'').trim().slice(0,40)};
})}
async function searchMenuState(p){
 return p.evaluate(()=>{
  const i=document.getElementById('searchInput'),ir=i?.getBoundingClientRect();
  if(!ir)return {open:false};
  const candidates=[...document.querySelectorAll('.open')].filter(e=>{
   if(e===i||e.contains(i))return false;
   const r=e.getBoundingClientRect(),cs=getComputedStyle(e);
   return r.width>0&&r.height>0&&cs.display!=='none'&&cs.visibility!=='hidden'&&
    r.left<ir.right+120&&r.right>ir.left-120&&r.top>=ir.top-20&&r.top<ir.bottom+500;
  });
  const menu=candidates.sort((a,b)=>a.getBoundingClientRect().height-b.getBoundingClientRect().height)[0];
  const r=menu?.getBoundingClientRect();
  return {open:!!menu,selector:menu?.id?'#'+menu.id:menu?.className,
   text:menu?.innerText?.slice(0,180)||'',position:r?{x:r.left+r.width/2,y:r.top+Math.min(r.height/2,30)}:null};
 });
}
async function dropdownRegression(p){
 const test={};
 await p.locator('#searchInput').fill('iow');
 await p.waitForTimeout(950);
 test.before=await searchMenuState(p);
 if(!test.before.open)throw Error('Dropdown not open after trusted typing: '+JSON.stringify(test.before));
 // Prefer the first visible child option; dispatch an actual user click through Playwright.
 const option=await p.evaluate(()=>{
  const i=document.getElementById('searchInput'),ir=i.getBoundingClientRect();
  const menus=[...document.querySelectorAll('.open')].filter(e=>!e.contains(i)&&e.getBoundingClientRect().top>=ir.top-20&&e.getBoundingClientRect().top<ir.bottom+500&&e.getBoundingClientRect().width>0);
  const menu=menus.sort((a,b)=>a.getBoundingClientRect().height-b.getBoundingClientRect().height)[0];
  if(!menu)return null;
  const nodes=[...menu.querySelectorAll('button,[role=option],li,[data-index],a')];
  const node=nodes.find(n=>{const r=n.getBoundingClientRect();return r.width>0&&r.height>0})||menu.firstElementChild;
  if(!node)return null;const r=node.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2};
 });
 if(!option)throw Error('No selectable dropdown option');
 await p.mouse.click(option.x,option.y);
 await p.waitForTimeout(2000);
 await p.locator('#searchInput').click();
 test.afterRefocus=await searchMenuState(p);
 await p.locator('#searchInput').press('End');
 await p.keyboard.type('a');
 await p.waitForTimeout(800);
 test.afterTyping=await searchMenuState(p);
 test.pass=test.before.open&&!test.afterRefocus.open&&test.afterTyping.open;
 return test;
}
async function runBaseline(){
 const bp=await context.newPage(),outcome={ref:productionRef,sha:baselineSha,pageErrors:[],census:[]};
 bp.on('pageerror',e=>outcome.pageErrors.push(String(e)));
 bp.on('response',r=>{if(/census\.gov/i.test(r.url()))outcome.census.push({url:r.url().slice(0,300),status:r.status()})});
 bp.on('requestfailed',r=>{if(/census\.gov/i.test(r.url()))outcome.census.push({url:r.url().slice(0,300),error:r.failure()?.errorText||'request failed'})});
 await bp.route('**/*',r=>{
  if(r.request().isNavigationRequest()&&r.request().resourceType()==='document')
   return r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:baselineHtml,headers:{'cache-control':'no-store'}});
  return r.continue();
 });
 try{
  const resp=await bp.goto('https://earthlinedevelopment.org/?hf3=baseline-'+engine,{waitUntil:'domcontentloaded',timeout:60000});
  outcome.receivedSha=createHash('sha256').update(await resp.body()).digest('hex');
  await bp.waitForSelector('#searchInput',{timeout:30000});
  try{outcome.dropdown=await dropdownRegression(bp)}catch(e){outcome.dropdown={pass:false,error:String(e)}}
  await bp.evaluate(()=>{const x=document.getElementById('searchInput'),b=document.getElementById('runBtn');x.value='Iowa state';x.dispatchEvent(new Event('input',{bubbles:true}));x.dispatchEvent(new Event('change',{bubbles:true}));b.click()});
  await bp.waitForFunction(()=>{const t=document.getElementById('earthlineVermontStatus16147')?.textContent||'';return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||/screening published|regional analysis complete|analysis failed/i.test(t)},null,{timeout:engine==='webkit'?180000:120000,polling:150});
  await bp.evaluate(()=>{const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;m?.jumpTo({zoom:7})});
  await bp.waitForTimeout(1100);
  outcome.z7=await overlay(bp);
  outcome.inputFingerprint=await bp.evaluate(()=>({
   location:(typeof M!=='undefined'&&M.loc)?JSON.stringify(M.loc).slice(0,500):null,
   regional:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.inputFingerprint??null,
   performance:window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.inputFingerprint??null
  }));
  await bp.screenshot({path:out+'/production-z7.png',timeout:20000});result.screenshots.push(out+'/production-z7.png');
  const prepared=await bp.evaluate(async()=>{
   if(typeof M==='undefined'||typeof window.earthlineSelectedSiteFromCenter!=='function'||typeof window.applyLocation!=='function'||typeof window.earthlineSetPropertyTarget16201!=='function')return false;
   const p={lng:-93.38977,lat:41.95715},site=window.earthlineSelectedSiteFromCenter(M.loc||null,p.lng,p.lat,20);
   if(!site||!await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false}))return false;
   return !!window.earthlineSetPropertyTarget16201({...p,source:'hotfix3-baseline'},{openPanel:false});
  });
  outcome.propertyPrepared=prepared;
  if(prepared){
   await bp.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());
   await bp.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:engine==='webkit'?180000:120000});
   outcome.property=await bp.evaluate(()=>({count:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220?.count??null}));
   await bp.evaluate(()=>window.earthlineOpenVermontReport16151?.());
   try{await bp.waitForSelector('#earthlineVermontReportPanel16149.open .el49-report',{timeout:15000})}catch(_){}
   outcome.report=await bp.evaluate(()=>({open:!!document.querySelector('#earthlineVermontReportPanel16149.open'),
    location:[...document.querySelectorAll('#earthlineVermontReportPanel16149 .el49-cover .el49-location')].map(x=>x.textContent),
    aquiferNote:document.querySelector('#earthlineVermontReportPanel16149 svg')?.textContent.includes('Aquifer context not loaded')||false}));
  }
 }catch(e){outcome.error=String(e)}finally{await bp.close()}
 return outcome;
}
try{
 const response=await page.goto('https://earthlinedevelopment.org/?hf3='+engine,{waitUntil:'domcontentloaded',timeout:60000});
 result.document={status:response.status(),header:response.headers()['x-hotfix3-candidate'],hits:docHits,receivedSha:createHash('sha256').update(await response.body()).digest('hex')};
 await page.waitForSelector('#searchInput',{timeout:30000});
 try{result.dropdown=await dropdownRegression(page)}catch(e){result.dropdown={pass:false,error:String(e)}}
 const start=Date.now();
 await trigger('Iowa state');
 await page.waitForFunction(()=>{const t=document.getElementById('earthlineVermontStatus16147')?.textContent||'';const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(!!m&&/screening published|regional analysis complete/i.test(t)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191)},null,{timeout:engine==='webkit'?180000:120000,polling:150});
 result.regionalMs=Date.now()-start;
 result.mapReady=await page.evaluate(()=>{const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;return !!m});
 if(!result.mapReady)throw Error('Mapbox unavailable after Regional publication: '+JSON.stringify({consoleErrors:result.consoleErrors.slice(-5),pageErrors:result.pageErrors}));
 await zoom(7);
 result.regionalZ7=await overlay();
 result.inputFingerprint=await page.evaluate(()=>({
  location:(typeof M!=='undefined'&&M.loc)?JSON.stringify(M.loc).slice(0,500):null,
  regional:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.inputFingerprint??null,
  performance:window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.inputFingerprint??null
 }));
 result.checks.z7=result.regionalZ7.drawn===0&&result.regionalZ7.pills>0;
 await screenshot('iowa-z7');
 result.z11Target=await topLabelPosition(page);
 await zoom(11,result.z11Target);
 result.regionalZ11=await overlay();
 result.checks.z11=!!result.z11Target&&result.regionalZ11.groupDisplay!=='none'&&result.regionalZ11.inViewPaths>0;
 await screenshot('iowa-z11');
 result.regionalChip=await page.evaluate(()=>({chip:document.getElementById('earthlineTierNotice16173')?.textContent||'',visible:document.getElementById('earthlineTierNotice16173')?.classList.contains('visible')||false}));
 result.checks.regionalChip=!result.regionalChip.visible;
 result.legends=await page.evaluate(()=>{const ids=['earthlineSwaleLegend16050','earthlineAquiferLegend16070','earthlineDiagramLegend16080'];return ids.map(id=>{const el=document.getElementById(id);if(!el)return {id,present:false};const r=el.getBoundingClientRect(),c=getComputedStyle(el);return {id,present:true,display:c.display,visibility:c.visibility,left:r.left,right:r.right,visible:c.display!=='none'&&c.visibility!=='hidden'&&r.width>0&&r.left<innerWidth&&r.right>0}})});
 result.checks.legends=result.legends.every(x=>x.present&&x.visible);
 await screenshot('regional-open-panel-legends');
 const prepared=await page.evaluate(async()=>{
  if(typeof M==='undefined'||typeof window.earthlineSelectedSiteFromCenter!=='function'||typeof window.applyLocation!=='function'||typeof window.earthlineSetPropertyTarget16201!=='function')return false;
  const p={lng:-93.38977,lat:41.95715},site=window.earthlineSelectedSiteFromCenter(M.loc||null,p.lng,p.lat,20);
  if(!site||!await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false}))return false;
  return !!window.earthlineSetPropertyTarget16201({...p,source:'hotfix3-review'},{openPanel:false})
 });
 result.propertyPrepared=prepared;
 if(prepared){
  const startProperty=Date.now();
  await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());
  await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:engine==='webkit'?180000:120000});
  result.propertyMs=Date.now()-startProperty;
  result.property=await page.evaluate(()=>({count:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220?.count??null,elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null}));
  result.checks.property=Number.isFinite(result.property.count);
  await screenshot('property');
  await page.evaluate(()=>window.earthlineOpenVermontReport16151?.());
  try{await page.waitForSelector('#earthlineVermontReportPanel16149.open .el49-report',{timeout:15000})}catch(_){}
  result.report=await page.evaluate(()=>({open:!!document.querySelector('#earthlineVermontReportPanel16149.open'),text:document.querySelector('#earthlineVermontReportPanel16149')?.innerText.slice(0,1600)||'',location:[...document.querySelectorAll('#earthlineVermontReportPanel16149 .el49-cover .el49-location')].map(x=>x.textContent),aquiferNote:document.querySelector('#earthlineVermontReportPanel16149 svg')?.textContent.includes('Aquifer context not loaded')||false}));
  result.checks.report=!!result.report.open&&result.report.location.length>=1;
  result.report.hasNamedPlace=result.report.location.some(x=>/[A-Za-z]{3,}/.test(x)&&!/^\s*(?:\d|coordinates?)/i.test(x));
 result.checks.aquifer=!result.report.aquiferNote;
  await screenshot('report');
 }
 result.checks.noPageErrors=result.pageErrors.length===0;
 result.checks.document=result.document.status===200&&result.document.header==='review'&&result.document.hits===1&&result.document.receivedSha===identity;
 result.passed=Object.values(result.checks).every(Boolean);
}catch(e){result.failure=String(e);result.passed=false}
finally{
 // Independently test the exact production commit in the same runner/browser.
 try{result.baseline=await runBaseline()}catch(e){result.baseline={error:String(e)}}
 // Capture inputs at Regional publication, before changing to Property.
 const b=result.baseline||{};
 const matching=!!result.inputFingerprint&&!!b.inputFingerprint&&
  JSON.stringify(result.inputFingerprint)===JSON.stringify(b.inputFingerprint);
 result.pair={matchingInputs:matching,candidate:result.inputFingerprint,baseline:b.inputFingerprint,
  z7Candidate:result.regionalZ7,z7Production:b.z7,propertyCandidate:result.property?.count,propertyProduction:b.property?.count,
  reportCandidate:result.report?.location,reportProduction:b.report?.location,
  baselineReceivedShaMatches:b.receivedSha===baselineSha};
 // Do not bless unpaired data or substitute hard-coded historical counts.
 result.checks.pairedIdentity=result.pair.baselineReceivedShaMatches;
 result.checks.pairedZ7=matching&&!!b.z7&&!!result.regionalZ7&&
  ['generated','processedPaths','pills'].every(k=>b.z7[k]===result.regionalZ7[k]);
 result.checks.pairedProperty=matching&&!!b.property&&!!result.property&&
  b.property.count===result.property.count;
 result.checks.pairedReport=matching&&!!b.report&&!!result.report&&
  b.report.open===result.report.open;
 // Candidate must pass after trusted typing; production must reproduce the failure.
 result.checks.dropdown=!!result.dropdown?.pass&&b.dropdown?.pass===false;
 result.passed=Object.values(result.checks).every(Boolean)&&!result.failure;
 result.finishedAt=new Date().toISOString();
 await writeFile(out+'/results.json',JSON.stringify(result,null,2));
 await browser.close();
 console.log('HOTFIX3_SUMMARY '+JSON.stringify({engine,passed:result.passed,checks:result.checks,z7:result.regionalZ7,z11:result.regionalZ11,z11Target:result.z11Target,property:result.property?.count,report:result.report?.location,baseline:result.baseline,pair:result.pair,dropdown:result.dropdown,census:result.census,pageErrors:result.pageErrors,failure:result.failure}));
}
if(!result.passed)process.exitCode=1;
