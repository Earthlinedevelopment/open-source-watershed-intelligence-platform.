import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const ROOT='https://earthlinedevelopment.org/reference-2026-10-05/';
const queries=['Arizona','Arkansas'];
mkdirSync('artifacts/oct05-control',{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[];
for(const q of queries){
 const ctx=await browser.newContext({viewport:{width:1800,height:830}});
 const page=await ctx.newPage();
 const errors=[],badHttp=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(ROOT))badHttp.push({status:r.status(),url:r.url()})});
 const t=Date.now();let failure=null;
 try{
   await page.goto(ROOT+'?reference='+encodeURIComponent(q)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForSelector('#searchInput',{timeout:15000});
   await page.evaluate(query=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=query;i.dispatchEvent(new Event('input',{bubbles:true}));
    i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
   },q);
   await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
     !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:65000,polling:200});
   await page.waitForTimeout(700);
 }catch(e){failure=String(e)}
 const snap=await page.evaluate(()=>{
   const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{};
   const a=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
   const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||{};
   const circles=[...document.querySelectorAll('svg circle')];
   const dark=circles.filter(c=>{
    const fill=String(c.getAttribute('fill')||getComputedStyle(c).fill).toLowerCase();
    return ['black','#000','#000000','rgb(0, 0, 0)','rgb(0,0,0)'].includes(fill);
   });
   const nearby=circles.filter(c=>{const r=c.getBoundingClientRect();return r.width>=12&&r.height>=12}).length;
   const overlay=document.querySelector('svg:has([data-layer="swale-opportunities"])');
   return {profileId:pkg.profileId||null,coreMs:p.phaseTotalsMs?.coreTotalMs??null,
     swales:a.generated??null,displayed:a.overlaySwaleLines??null,
     waterPaths:p.waterPaths??null,fatal:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
     circleCount:circles.length,blackCircles:dark.length,largeCircles:nearby,
     overlayPresent:!!overlay,canvasCount:document.querySelectorAll('canvas').length};
 }).catch(e=>({evaluationFailure:String(e)}));
 const row={query:q,wallMs:Date.now()-t,error:failure,errors,badHttp,snap};
 rows.push(row);console.log('EARTHLINE_OCT05_BROWSER '+JSON.stringify(row));
 await page.screenshot({path:'artifacts/oct05-control/'+q.toLowerCase()+'.png'}).catch(()=>{});
 await ctx.close();
}
await browser.close();
writeFileSync('artifacts/oct05-control/results.json',JSON.stringify(rows,null,2));
const bad=rows.some(r=>r.error||r.errors.length||r.badHttp.length||r.snap?.fatal||r.snap?.evaluationFailure||
    !(r.snap?.swales>0)||!(r.snap?.waterPaths>0));
console.log('EARTHLINE_OCT05_CONTROL '+JSON.stringify({passed:!bad,rows:rows.map(r=>({query:r.query,core:r.snap?.coreMs,swales:r.snap?.swales,water:r.snap?.waterPaths,dark:r.snap?.blackCircles,errors:r.errors.length,problem:r.error||r.snap?.fatal}))}));
if(bad)process.exitCode=1;
