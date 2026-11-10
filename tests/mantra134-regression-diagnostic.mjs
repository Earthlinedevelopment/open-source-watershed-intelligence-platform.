import {chromium} from 'playwright';
import {writeFile,mkdir} from 'node:fs/promises';
await mkdir('artifacts/m134',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
const page=await browser.newPage({viewport:{width:1800,height:900},serviceWorkers:'block'});
const log={errors:[],badRequests:[],snapshots:{},events:[]};
page.on('pageerror',e=>log.errors.push(String(e)));
page.on('requestfailed',r=>{if(/elder|overpass|mapbox/.test(r.url()))log.badRequests.push({url:r.url().slice(0,150),failure:r.failure()?.errorText})});
try{
 await page.goto('https://earthlinedevelopment.org/?m134='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('#searchInput').fill('Iowa');
 await page.locator('#searchInput').press('Enter');
 await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970,null,{timeout:120000});
 await page.waitForTimeout(1400);
 const observe=()=>page.evaluate(()=>{
  const m=typeof M!=='undefined'?M:window.M, map=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;
  const elder=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
  const g=document.querySelector('#earthlineRegionalVectorOverlay16020 g[data-layer="swale-opportunities"]');
  const p=document.querySelector('#earthlineRegionalVectorOverlay16020 g[data-layer="water-paths"]');
  const swale=map.getLayer('earthline-swales-line');
  const visibleLayers=(map.getStyle()?.layers||[]).filter(l=>/swale|water|recharge|aquifer/.test(l.id)).slice(0,60).map(l=>({id:l.id,type:l.type,visibility:map.getLayoutProperty(l.id,'visibility')||'visible'}));
  return {zoom:map.getZoom(),center:map.getCenter().toArray(),status:document.getElementById('earthlineVermontStatus16147')?.textContent?.slice(0,300),
  regionalSwaleGroupDisplay:g?getComputedStyle(g).display:null,regionalSwalePathCount:g?.querySelectorAll('path').length||0,
  regionalWaterPathCount:p?.querySelectorAll('path').length||0,activeRun:window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970,
  visibleLayers,elder,elderText:document.body.innerText.match(/Elder Trees[^\n]{0,170}/i)?.[0]||null};
 });
 log.snapshots.regional=await observe();
 await page.screenshot({path:'artifacts/m134/iowa-regional.png',timeout:20000});
 await page.evaluate(()=>{const map=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;map.stop();map.jumpTo({center:[-93.51983,42.08043],zoom:17.7});});
 await page.waitForTimeout(2600);
 log.snapshots.preProperty=await observe();
 await page.locator('#earthlineDeclareProperty16169').click({timeout:16000});
 await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:110000});
 log.snapshots.property=await page.evaluate(()=>{
 const m=typeof M!=='undefined'?M:window.M,map=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap,a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{},s=m?.swaleDiagnostics?.stage||{},sw=Array.isArray(m?.swales)?m.swales:[];
 return {run:a,resultLock:m?.propertyResultLock15815?.safetyVerified,publication:m?.propertyPublication15816,
  slopes:{max:Math.max(0,...sw.map(x=>Number(x.slope)||0)),count:sw.length},rejected:s.rejectSlopeAbove4M131||0,stage:s,
  mapCenter:map.getCenter().toArray(),location:m?.lastLocationIntegrity15801||m?.propertyRunFailure16539?.audit||null,
  vector:m?.vectorNoBuildCoverage,safety:m?.safetyAudit15806?.verified,elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
  text:document.getElementById('earthlineVermontStatus16147')?.textContent?.slice(0,350)};
 });
 await page.screenshot({path:'artifacts/m134/iowa-property.png',timeout:20000});
 await page.waitForTimeout(4800);
 log.snapshots.elderLater=await page.evaluate(()=>({elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,text:document.body.innerText.match(/Elder Trees[^\n]{0,170}/i)?.[0]||null}));
}catch(e){log.failure=String(e)}
await writeFile('artifacts/m134/results.json',JSON.stringify(log,null,2));
console.log('M134_REGRESSION_DIAGNOSTIC '+JSON.stringify(log).slice(0,30000));
await browser.close();
if(log.failure)process.exitCode=1;
