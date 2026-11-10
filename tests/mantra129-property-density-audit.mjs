import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('artifacts/m129-property',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']});
const p=await browser.newPage({viewport:{width:1800,height:1000},serviceWorkers:'block'});
const center={lng:-72.45500,lat:43.88110},out={location:center,errors:[],checks:{}};
p.on('pageerror',e=>out.errors.push(String(e)));
try{
 await p.goto('https://earthlinedevelopment.org/?m129parcel='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 await p.locator('#searchInput').fill('Rutland, Vermont');
 await p.waitForFunction(()=>document.querySelector('#earthlineSearchSuggestions15970')?.classList.contains('open'),null,{timeout:18000});
 await p.locator('#earthlineSearchSuggestions15970 button[data-query]').first().click();
 await p.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970,null,{timeout:110000});
 await p.waitForTimeout(1900);
 await p.evaluate(center=>{const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;m.stop();m.jumpTo({center:[center.lng,center.lat],zoom:17.7});},center);
 await p.waitForFunction(()=>{const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;return Math.abs(m?.getZoom?.()-17.7)<.1;},null,{timeout:16000});
 await p.waitForTimeout(2200);
 out.preclick=await p.evaluate(()=>{const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;return {zoom:m?.getZoom(),center:m?.getCenter(),target:window.EARTHLINE_PROPERTY_TARGET_16201}});
 await p.locator('#earthlineDeclareProperty16169').click({timeout:15000});
 await p.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:110000});
 try{await p.waitForFunction(()=>['committed','failed'].includes(window.EARTHLINE_ELDER_TREE_LAST_17097?.state),null,{timeout:30000});}catch{}
 await p.waitForTimeout(950);
 out.audit=await p.evaluate(()=>{
  const md=(typeof M!=='undefined'?M:window.M)||{},sw=md?.authoritativeSafeSwales15815?.features||[];
  const map=(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap);
  const elderLayer='earthline-elder-tree-points-17097',el=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
  const lines=sw.map(f=>f.geometry?.coordinates||[]).filter(c=>c.length>1);
  const length=c=>c.slice(1).reduce((a,p,i)=>{let q=c[i],lat=(p[1]+q[1])/2*Math.PI/180;return a+Math.hypot((p[0]-q[0])*111320*Math.cos(lat),(p[1]-q[1])*110540)},0);
  const len=lines.map(length).sort((a,b)=>a-b),mdpt=c=>c[Math.floor(c.length/2)],mids=lines.map(mdpt);
  const spacing=mids.map((pt,i)=>mids.reduce((closest,q,j)=>{if(i===j)return closest;const lat=(pt[1]+q[1])/2*Math.PI/180;return Math.min(closest,Math.hypot((pt[0]-q[0])*111320*Math.cos(lat),(pt[1]-q[1])*110540))},Infinity)).filter(Number.isFinite).sort((a,b)=>a-b);
  let elderRendered=null;try{elderRendered=map?.getLayer(elderLayer)?map.queryRenderedFeatures({layers:[elderLayer]})?.length:null}catch{}
  const engine=Array.isArray(md.swales)?md.swales:[];
  const grade=field=>{const nums=engine.map(x=>Number(x[field])).filter(Number.isFinite).sort((a,b)=>a-b);return {nonzero:nums.filter(x=>x>0).length,min:nums[0]??null,p10:nums[Math.floor(nums.length*.1)]??null,median:nums[Math.floor(nums.length*.5)]??null,p90:nums[Math.floor(nums.length*.9)]??null,max:nums.at(-1)??null}};
  const density={count:engine.length,forested:engine.filter(x=>x.forested===true).length,canopyOver40:engine.filter(x=>Number(x.canopy)>.4).length,
    primaryFlow:engine.filter(x=>x.primaryFlowFirst15836===true).length,
    flowScore:grade('prescriptionFlowScore15833'),score:grade('score'),canopy:grade('canopy'),slope:grade('slope'),flowCrossing:grade('seedFlowCrossing15833')};
  const diag=md?.swaleDiagnostics||{},g=diag?.stage||{},audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{},evidence=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||{};
  return {tier:document.documentElement.dataset.earthlineAnalysisTier,
   result:audit.result,elapsedSeconds:audit.elapsedSeconds,settled:audit.settled,center:audit.center,error:audit.error,
   safeCount:evidence.safeCount,published:evidence.published,engineCount:md.swales?.length,
   lines:lines.length,lengthMeters:{p10:len[Math.floor(len.length*.1)]??null,median:len[Math.floor(len.length*.5)]??null,p90:len[Math.floor(len.length*.9)]??null,total:len.reduce((x,y)=>x+y,0)},
   spacingMeters:{p10:spacing[Math.floor(spacing.length*.1)]??null,median:spacing[Math.floor(spacing.length*.5)]??null,p90:spacing[Math.floor(spacing.length*.9)]??null},
   generation:g,density,mask:md.noBuildProvenance15843,safety:md.safetyAudit15806,
   elder:{state:el.state,count:el.featureCount,visibleAt:el.visibleAt||null,workerTimings:el.workerTimings||null,mapSource:map?.getSource('earthline-elder-trees-17097')?._data?.features?.length??null,rendered:elderRendered,
    iconAnchor:map?.getLayer(elderLayer)?map.getLayoutProperty(elderLayer,'icon-anchor'):null,text:map?.getLayer(elderLayer)?map.getLayoutProperty(elderLayer,'text-field'):null},
   status:document.getElementById('earthlineVermontStatus16147')?.textContent?.slice(0,330)};
 });
 out.checks.propertyPublished=out.audit.result===true&&out.audit.published===true;
 out.checks.actualSwaleCount=out.audit.lines>0;
 await p.screenshot({path:'artifacts/m129-property/vermont-43.8811--72.455.png',timeout:25000});
}catch(e){out.failure=String(e)}
await writeFile('artifacts/m129-property/results.json',JSON.stringify(out,null,2));
console.log('M129_PROPERTY_AUDIT '+JSON.stringify(out));
await browser.close();
if(out.failure||!out.checks.propertyPublished)process.exitCode=1;