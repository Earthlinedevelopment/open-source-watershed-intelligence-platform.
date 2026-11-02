import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const BASE='https://earthlinedevelopment.org/';
const source=readFileSync('artifacts/m92-fastpath/source.html','utf8');
const original1='(++yieldCount16661%384)===0',original2='(++finalScreenYield16661%384)===0';
const arr='if(![xi16584,yi16584,xj16584,yj16584].every(Number.isFinite))continue;';
const noArr='if(!Number.isFinite(xi16584)||!Number.isFinite(yi16584)||!Number.isFinite(xj16584)||!Number.isFinite(yj16584))continue;';
for(const text of [original1,original2,arr])if(source.split(text).length!==2)throw Error('Source owner changed: '+text);
const modes=[
{name:'accepted-384',html:source},
{name:'faster-1024',html:source.replace(original1,'(++yieldCount16661%1024)===0')
  .replace(original2,'(++finalScreenYield16661%1024)===0').replace(arr,noArr)},
{name:'faster-1536',html:source.replace(original1,'(++yieldCount16661%1536)===0')
  .replace(original2,'(++finalScreenYield16661%1536)===0').replace(arr,noArr)}
];
const states=['Alaska','Arizona'];
const browser=await chromium.launch({headless:true});
mkdirSync('artifacts/m92-fastpath/results',{recursive:true});
const rows=[];
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex');
for(const mode of modes)for(const q of states){
 const ctx=await browser.newContext({viewport:{width:1600,height:950}}),page=await ctx.newPage();
 const errs=[];page.on('pageerror',e=>errs.push(String(e)));
 await page.route('**/*',route=>{
  const r=route.request();
  if(r.isNavigationRequest()&&r.resourceType()==='document'&&r.url().startsWith(BASE))
   return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:mode.html});
  return route.continue();
 });
 let error=null,elapsed=null;
 const start=Date.now();
 try{
  await page.goto(BASE+'?m92hotpath='+mode.name+'-'+q+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:15000});
  await page.evaluate(v=>{
   let input=document.getElementById('searchInput');input.value=v;
   input.dispatchEvent(new Event('input',{bubbles:true}));
   input.dispatchEvent(new Event('change',{bubbles:true}));
   document.getElementById('runBtn').click();
  },q);
  await page.waitForFunction(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
    window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:100000,polling:200});
 }catch(e){error=String(e)}
 const snap=await page.evaluate(()=>{
  const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{},a=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{},
    pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||{};
  let features=[];try{
   const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
   const src=map?.getSource?.('el-live-swales-15970');
   features=src?._data?.features||src?.serialize?.()?.data?.features||[];
  }catch{}
  const g=document.querySelector('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"]');
  const paths=[...(g?.querySelectorAll(':scope > path')||[])];
  const bad=paths.filter(el=>{
   if(el.getAttribute('stroke')!=='rgba(8,18,13,.96)')return false;
   let len=Infinity;try{len=el.getTotalLength()}catch{}
   return len<3&&(parseFloat(getComputedStyle(el).strokeWidth)||0)>=10;
  }).length;
  return {coreMs:p.phaseTotalsMs?.coreTotalMs??null,phases:p.phaseTotalsMs||null,swales:a.generated??null,
   source:a.sourceFeatures??null,display:a.overlaySwaleLines??null,water:p.waterPaths??null,profile:pkg.profileId||null,
   blackDots:bad,geometry:features.map(f=>f.geometry?.coordinates||[]),
   fatal:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
 });
 const row={mode:mode.name,q,core:snap.coreMs,phases:snap.phases,wall:Date.now()-start,swales:snap.swales,
  source:snap.source,display:snap.display,water:snap.water,profile:snap.profile,
  blackDots:snap.blackDots,geometryHash:hash(snap.geometry),errors:errs.slice(-3),failure:error||snap.fatal};
 rows.push(row);console.log('M92_FASTPATH '+JSON.stringify(row));
 await ctx.close();
}
await browser.close();
writeFileSync('artifacts/m92-fastpath/results/compare.json',JSON.stringify(rows,null,2));
let bad=[];
for(const q of states){const set=rows.filter(x=>x.q===q),ref=set[0];for(const x of set){
 if(x.geometryHash!==ref.geometryHash)bad.push(q+' science changed '+x.mode);
 if(x.swales!==ref.swales||x.water!==ref.water||x.source!==x.swales||x.display!==x.swales)
    bad.push(q+' source/display/water mismatch '+x.mode);
 if(x.blackDots>0)bad.push(q+' visual dots '+x.mode);
 if(x.failure||x.errors.length)bad.push(q+' runtime fail '+x.mode);
}}
console.log('M92_FASTPATH_SUMMARY '+JSON.stringify({bad,
 comparisons:states.map(q=>({q,variants:rows.filter(x=>x.q===q).map(x=>({mode:x.mode,core:x.core,swales:x.swales,hash:x.geometryHash,blackDots:x.blackDots}))}))}));
if(bad.length)process.exitCode=1;
