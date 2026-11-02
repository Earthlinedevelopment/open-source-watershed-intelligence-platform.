import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const URL='https://earthlinedevelopment.org/candidate-mantra92/';
const runs=['Arizona','Alaska','Arizona'];
mkdirSync('artifacts/mantra92-timing',{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
for(const [i,name] of runs.entries()){
 const ctx=await browser.newContext({viewport:{width:1800,height:832}}),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const started=Date.now();let failure=null;
 try{
  await page.goto(URL+'?m92timing='+Date.now()+'-'+i,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:16000});
  await page.evaluate(q=>{const e=document.getElementById('searchInput');e.value=q;e.dispatchEvent(new Event('input',{bubbles:true}));
    e.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('runBtn').click()},name);
  await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
    !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:100000,polling:200});
 }catch(e){failure=String(e)}
 const snap=await page.evaluate(()=>{
  const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{},pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
  const resources=performance.getEntriesByType('resource').map(e=>({name:e.name,ms:e.duration,transfer:e.transferSize||0}))
    .filter(e=>e.ms>100).sort((a,b)=>b.ms-a.ms).slice(0,18);
  const possible=Object.keys(window).filter(k=>/PERFORM|STAGE|TIMING|PROFILE|ACQUISITION|SWALE.*AUDIT|GRID.*AUDIT|TRACE.*AUDIT/i.test(k)&&k.includes('EARTHLINE')).slice(-100);
  const phases=p.phaseTotalsMs||p;
  return {coreMs:p.phaseTotalsMs?.coreTotalMs??null,phaseTotals:phases,pub:{swales:pub.generated,displayed:pub.overlaySwaleLines},
    resourceCount:performance.getEntriesByType('resource').length,longResources:resources,auditKeys:possible,
    regionalError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    stage:window.EARTHLINE_M92_STAGE_TIMINGS||null,
    jsHeap:performance.memory?.usedJSHeapSize||null};
 });
 const row={name,wallMs:Date.now()-started,snap,failure,errors};results.push(row);
 console.log('M92_LIVE_TIMING '+JSON.stringify(row));
 await ctx.close();
}
await browser.close();
writeFileSync('artifacts/mantra92-timing/measurements.json',JSON.stringify(results,null,2));
console.log('M92_LIVE_TIMING_SUMMARY '+JSON.stringify(results.map(r=>({name:r.name,core:r.snap?.coreMs,phases:r.snap?.phaseTotals,wall:r.wallMs,errors:r.errors}))));
