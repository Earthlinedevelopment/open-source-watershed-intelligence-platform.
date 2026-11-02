import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const BASE='https://earthlinedevelopment.org/';
const base=readFileSync('artifacts/mantra92/yield-ab/index.html','utf8');
const finite='if(![xi16584,yi16584,xj16584,yj16584].every(Number.isFinite))continue;';
if(base.split(finite).length!==2)throw Error('Unmodified ring-predicate source was not unique');
const modes=[
 {name:'current-memo',html:base},
 {name:'memo-no-array',html:base.replace(finite,'if(!Number.isFinite(xi16584)||!Number.isFinite(yi16584)||!Number.isFinite(xj16584)||!Number.isFinite(yj16584))continue;')}
];
const states=['Alaska','New York','Maryland'];
const browser=await chromium.launch({headless:true});
const rows=[];
mkdirSync('artifacts/mantra92/yield-ab/results',{recursive:true});
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
for(const m of modes)for(const q of states){
 const ctx=await browser.newContext({viewport:{width:1600,height:950}});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/*',route=>{
   const req=route.request();
   if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE))
    return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:m.html});
   return route.continue();
 });
 let failure=null;
 const start=Date.now();
 try{
  await page.goto(BASE+'?m92geoab='+m.name+'-'+encodeURIComponent(q),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:15000});
  await page.evaluate(q=>{
    const e=document.getElementById('searchInput');e.value=q;
    e.dispatchEvent(new Event('input',{bubbles:true}));
    e.dispatchEvent(new Event('change',{bubbles:true}));
    document.getElementById('runBtn').click();
  },q);
  await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
    !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:90000,polling:200});
 }catch(e){failure=String(e)}
 const snap=await page.evaluate(()=>{
  const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{},
    pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{},
    pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||{};
  let features=[];
  try{
   const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
   const s=map?.getSource?.('el-live-swales-15970');
   features=s?._data?.features||s?.serialize?.()?.data?.features||[];
  }catch{}
  return {coreMs:perf.phaseTotalsMs?.coreTotalMs??null,phases:perf.phaseTotalsMs||null,
     swales:pub.generated??null,source:pub.sourceFeatures??null,display:pub.overlaySwaleLines??null,
     water:perf.waterPaths??null,profile:pkg.profileId||null,
     geometry:features.map(f=>f.geometry?.coordinates||[]),
     error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
 });
 const row={mode:m.name,q,core:snap.coreMs,phases:snap.phases,swales:snap.swales,
   source:snap.source,display:snap.display,water:snap.water,profile:snap.profile,
   geometryHash:digest(snap.geometry),wall:Date.now()-start,
   errors:errors.slice(-5),failure:failure||snap.error};
 rows.push(row);console.log('M92_GEOMETRY_AB '+JSON.stringify(row));
 await ctx.close();
}
await browser.close();
const comparisons=[];
for(const q of states){
 const m=rows.filter(x=>x.q===q);
 comparisons.push({q,variants:m.map(x=>({
   mode:x.mode,core:x.core,swales:x.swales,digest:x.geometryHash,source:x.source,display:x.display,
   failed:!!x.failure||x.errors.length>0})),
  sameSwaleGeometry:m.every(x=>x.geometryHash===m[0].geometryHash)});
}
writeFileSync('artifacts/mantra92/yield-ab/results/geometry-ab.json',JSON.stringify({rows,comparisons},null,2));
console.log('M92_GEOMETRY_AB_SUMMARY '+JSON.stringify(comparisons));
if(rows.some(x=>x.failure||x.errors.length>0))process.exitCode=1;
