import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const SEQ=['Iowa','Arkansas','Iowa','Arkansas'];
mkdirSync('artifacts/mantra46-ia-ar-cycle',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1920,height:1080}});
const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
const rows=[];
await page.goto(BASE+'?m46_cycle='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
for(let n=0;n<SEQ.length;n++){
 const query=SEQ[n];windowThis: {
 }
 await page.evaluate(q=>{
   window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
   const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
   i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
 },query);
 let timedOut=false;
 try{
   await page.waitForFunction(([q,prior])=>{
     const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
     const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
     const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
     return /screening published\./i.test(status)&&String(root?.query||'').toLowerCase().includes(q.toLowerCase())&&String(perf?.runToken||'')!==prior;
   },[query,n?rows[n-1]?.runToken||'':''],{timeout:50000,polling:100});
 }catch(_){timedOut=true;}
 await page.waitForTimeout(1000);
 const snap=await page.evaluate(()=>{const c=window.earthlineMap&&typeof window.earthlineMap.getCenter==='function'?window.earthlineMap.getCenter():null;return {
   root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
   perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
   pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
   display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
   atomic:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,
   displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
   fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,
   center:c?{lng:Number(c.lng),lat:Number(c.lat)}:null,
   zoom:window.earthlineMap&&typeof window.earthlineMap.getZoom==='function'?Number(window.earthlineMap.getZoom()):null,
   crosshair:String(document.querySelector('[data-earthline-crosshair-readout]')?.textContent||document.body.innerText.match(/CROSSHAIR[^\n]*/)?.[0]||''),
   err:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
 };});
 const slug=(n+1)+'-'+query.toLowerCase();
 await page.screenshot({path:'artifacts/mantra46-ia-ar-cycle/'+slug+'.png',fullPage:false});
 const row={n:n+1,query,timedOut,runToken:snap.perf?.runToken||null,coreMs:snap.perf?.totalMs??null,generated:snap.pub?.generated??null,visible:snap.display?.swaleLines??snap.pub?.overlaySwaleLines??null,rootPass:snap.root?.pass??null,rootQuery:snap.root?.query??null,atomicName:snap.atomic?.identity?.name??null,displayedTier:snap.displayed?.tier??snap.displayed?.mode??null,center:snap.center,zoom:snap.zoom,crosshair:snap.crosshair,unresolvedFine:snap.fine?.unresolvedAfter?.length??null,err:snap.err||null,pageErrors:[...pageErrors]};
 rows.push(row);console.log('EARTHLINE_M46_CYCLE '+JSON.stringify(row));
}
writeFileSync('artifacts/mantra46-ia-ar-cycle/results.json',JSON.stringify(rows,null,2));
await browser.close();
