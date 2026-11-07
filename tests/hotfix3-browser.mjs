import {chromium,webkit} from 'playwright';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const engine=process.env.HF3_ENGINE||'chromium';
const browserType={chromium,webkit}[engine];
if(!browserType)throw Error('Unknown engine: '+engine);
const out='artifacts/hotfix3/'+engine;
await mkdir(out,{recursive:true});
const html=await readFile('index.html');
const identity=createHash('sha256').update(html).digest('hex');
const expected={generated:40,processedPaths:28,pills:11,property:57};
const result={engine,identity,expected,checks:{},pageErrors:[],consoleErrors:[],screenshots:[],startedAt:new Date().toISOString()};
const browser=await browserType.launch({headless:true,args:engine==='chromium'?['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']:[]});
const context=await browser.newContext({viewport:{width:1800,height:1000},serviceWorkers:'block'});
const page=await context.newPage();
page.on('pageerror',e=>result.pageErrors.push(String(e)));
page.on('console',msg=>{if(msg.type()==='error')result.consoleErrors.push(msg.text().slice(0,400))});
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
async function overlay(){
 return page.evaluate(()=>{
  const root=document.getElementById('earthlineRegionalVectorOverlay16020');
  const visible=el=>{
   for(let n=el;n&&n.nodeType===1;n=n.parentElement){const c=getComputedStyle(n);if(c.display==='none'||c.visibility==='hidden'||c.visibility==='collapse'||Number(c.opacity)===0)return false}
   const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.right>0&&r.left<innerWidth&&r.top<innerHeight
  };
  return {
   zoom:(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap)?.getZoom?.(),
   generated:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated??null,
   processedPaths:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040?.swaleLines??null,
   drawn:root?[...root.querySelectorAll('path.earthline-swale-core-16168')].filter(visible).length:0,
   pills:root?[...root.querySelectorAll('g.earthline-swale-label-16149')].filter(visible).length:0,
   status:document.getElementById('earthlineVermontStatus16147')?.textContent||'',
   body:document.body.innerText.slice(0,1000)
  }
 })
}
async function zoom(z){await page.evaluate(z=>{const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;if(!m)throw Error('No Mapbox map');m.jumpTo({zoom:z})},z);await page.waitForTimeout(1100)}
try{
 const response=await page.goto('https://earthlinedevelopment.org/?hf3='+engine,{waitUntil:'domcontentloaded',timeout:60000});
 result.document={status:response.status(),header:response.headers()['x-hotfix3-candidate'],hits:docHits};
 await page.waitForSelector('#searchInput',{timeout:30000});
 const start=Date.now();
 await trigger('Iowa state');
 await page.waitForFunction(()=>{const t=document.getElementById('earthlineVermontStatus16147')?.textContent||'';const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(!!m&&/screening published|regional analysis complete/i.test(t)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191)},null,{timeout:engine==='webkit'?180000:120000,polling:150});
 result.regionalMs=Date.now()-start;
 result.mapReady=await page.evaluate(()=>{const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;return !!m});
 if(!result.mapReady)throw Error('Mapbox unavailable after Regional publication: '+JSON.stringify({consoleErrors:result.consoleErrors.slice(-5),pageErrors:result.pageErrors}));
 await zoom(7);
 result.regionalZ7=await overlay();
 result.checks.z7=result.regionalZ7.generated===40&&result.regionalZ7.processedPaths===28&&result.regionalZ7.drawn===0&&result.regionalZ7.pills===11;
 await screenshot('iowa-z7');
 await zoom(11);
 result.regionalZ11=await overlay();
 result.checks.z11=result.regionalZ11.drawn>0;
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
  result.checks.property=result.property.count===expected.property;
  await screenshot('property');
  await page.evaluate(()=>window.earthlineOpenVermontReport16151?.());
  try{await page.waitForSelector('#earthlineVermontReportPanel16149.open .el49-report',{timeout:15000})}catch(_){}
  result.report=await page.evaluate(()=>({open:!!document.querySelector('#earthlineVermontReportPanel16149.open'),text:document.querySelector('#earthlineVermontReportPanel16149')?.innerText.slice(0,1600)||'',location:[...document.querySelectorAll('#earthlineVermontReportPanel16149 .el49-cover .el49-location')].map(x=>x.textContent),aquiferNote:document.querySelector('#earthlineVermontReportPanel16149 svg')?.textContent.includes('Aquifer context not loaded')||false}));
  result.checks.report=!!result.report.open&&result.report.location.length>=2&&result.report.location.some(x=>/[A-Za-z]{3,}/.test(x)&&!/^\s*(?:\d|coordinates?)/i.test(x));
 result.checks.aquifer=!result.report.aquiferNote;
  await screenshot('report');
 }
 result.checks.noPageErrors=result.pageErrors.length===0;
 result.checks.document=result.document.status===200&&result.document.header==='review'&&result.document.hits===1;
 result.passed=Object.values(result.checks).every(Boolean);
}catch(e){result.failure=String(e);result.passed=false}
finally{
 result.finishedAt=new Date().toISOString();
 await writeFile(out+'/results.json',JSON.stringify(result,null,2));
 await browser.close();
 console.log('HOTFIX3_SUMMARY '+JSON.stringify({engine,passed:result.passed,checks:result.checks,z7:result.regionalZ7,z11:result.regionalZ11,property:result.property?.count,report:result.report?.location,pageErrors:result.pageErrors,failure:result.failure}));
}
if(!result.passed)process.exitCode=1;
