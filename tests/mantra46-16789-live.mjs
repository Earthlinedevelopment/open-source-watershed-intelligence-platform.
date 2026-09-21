import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const CASES=['Arizona','Colorado','Kansas'];
mkdirSync('artifacts/mantra46-16789-live',{recursive:true});
const browser=await chromium.launch({headless:true});
const results=[];
for(const query of CASES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();
  try{
    await page.goto(BASE+'?earthline_m46_16789_live='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    const marker=await page.evaluate(()=>document.documentElement.outerHTML.includes('p16783.parent!==add16783.point.parent'));
    if(!marker)throw new Error('live product does not contain 16789 selection marker');
    await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
    try{
      await page.waitForFunction(q=>{
        const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;if(e)return true;
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191&&!!root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:45000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(350);
  }catch(e){loadError=String(e);}
  const a=loadError?{}:await page.evaluate(()=>({
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
  }));
  const row={query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,coreMs:a?.perf?.totalMs??null,
    generated:a?.pub?.generated??null,visible:a?.display?.swaleLines??a?.pub?.overlaySwaleLines??null,unsafe:a?.flow?.unsafeSegments??null,
    rootPass:a?.root?.pass??null,firstFailedStage:a?.root?.firstFailedStage??null,candidateCells:a?.spread?.candidateCells??null,
    finalCells:a?.spread?.finalCells??null,targetCells:a?.spread?.targetCells??null,swaps:a?.spread?.swaps??null,
    outsideAfterClip:a?.boundary?.outsideAfterClip??null,lastError:a?.lastError||null};
  results.push(row);console.log('EARTHLINE_M46_16789_LIVE '+JSON.stringify(row));await context.close();
}
await browser.close();
writeFileSync('artifacts/mantra46-16789-live/results.json',JSON.stringify(results,null,2));
if(results.some(r=>r.loadError||r.timedOut||r.lastError||r.pageErrors.length||Number(r.coreMs)>15000||Number(r.unsafe)!==0||Number(r.generated)!==Number(r.visible)||Number(r.outsideAfterClip?.swales||0)!==0||r.rootPass!==true||Number(r.finalCells)!==Number(r.targetCells)))process.exitCode=1;
