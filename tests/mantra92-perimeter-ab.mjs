import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const BASE='https://earthlinedevelopment.org/';
const plain=readFileSync('artifacts/m92-ring/old.html','utf8');
const revised=readFileSync('artifacts/m92-ring/new.html','utf8');
const states=['Alaska','Arizona'];
const variants=[{name:'original',html:plain},{name:'perimeter',html:revised}];
const browser=await chromium.launch({headless:true}),rows=[];
mkdirSync('artifacts/m92-ring/results',{recursive:true});
const digest=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
for(const v of variants)for(const q of states){
 const ctx=await browser.newContext({viewport:{width:1600,height:950}}),page=await ctx.newPage(),errs=[];
 page.on('pageerror',e=>errs.push(String(e)));
 await page.route('**/*',route=>{
  const req=route.request();
  if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE))
   return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:v.html});
  return route.continue();
 });
 let error=null;const start=Date.now();
 try{
  await page.goto(BASE+'?m92_ring='+v.name+'-'+q+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:15000});
  await page.evaluate(val=>{
    const i=document.getElementById('searchInput');
    i.value=val;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));
    document.getElementById('runBtn').click();
  },q);
  await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
    !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:90000,polling:200});
 }catch(e){error=String(e)}
 const snap=await page.evaluate(()=>{
  const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{},u=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
  const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||{};
  let features=[];try{
   const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
   const source=map?.getSource?.('el-live-swales-15970');
   features=source?._data?.features||source?.serialize?.()?.data?.features||[];
  }catch{}
  return {coreMs:p.phaseTotalsMs?.coreTotalMs??null,phases:p.phaseTotalsMs||null,
   swales:u.generated??null,source:u.sourceFeatures??null,display:u.overlaySwaleLines??null,
   water:p.waterPaths??null,profile:pkg.profileId||null,features:features.map(f=>({
    coords:f.geometry?.coordinates||[],slope:f.properties?.slope_pct,score:f.properties?.score})),
   fatal:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
 });
 const row={mode:v.name,q,wallMs:Date.now()-start,core:snap.coreMs,phases:snap.phases,
  swales:snap.swales,source:snap.source,display:snap.display,water:snap.water,
  profile:snap.profile,geometryHash:digest(snap.features),errors:errs.slice(-4),failure:error||snap.fatal};
 rows.push(row);console.log('M92_RING_COMPARE '+JSON.stringify(row));
 await ctx.close();
}
await browser.close();
writeFileSync('artifacts/m92-ring/results/comparison.json',JSON.stringify(rows,null,2));
const failures=[];const summary=[];
for(const q of states){
 const a=rows.find(x=>x.q===q&&x.mode==='original'),b=rows.find(x=>x.q===q&&x.mode==='perimeter');
 if(!a||!b){failures.push('Missing compare '+q);continue;}
 const ok=a.geometryHash===b.geometryHash&&a.swales===b.swales&&
  b.swales>0&&b.swales===b.source&&b.swales===b.display&&
  a.water===b.water&&!a.failure&&!b.failure&&!a.errors.length&&!b.errors.length;
 if(!ok)failures.push('Science/parity mismatch '+q);
 summary.push({q,before:a.core,after:b.core,change:b.core-a.core,swales:b.swales,water:b.water,
  geometryEqual:a.geometryHash===b.geometryHash,pass:ok});
}
console.log('M92_RING_VERDICT '+JSON.stringify({pass:!failures.length,failures,summary}));
if(failures.length)process.exitCode=1;
