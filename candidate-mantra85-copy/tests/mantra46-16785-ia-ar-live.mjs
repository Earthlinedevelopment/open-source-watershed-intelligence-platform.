import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Iowa','Arkansas'];
mkdirSync('artifacts/mantra46-16785',{recursive:true});

const browser=await chromium.launch({headless:true});
const results=[];

for(const query of CASES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;
  const started=Date.now();

  try{
    await page.goto(BASE+'?earthline_m46_16785='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    const marker=await page.evaluate(()=>document.documentElement.outerHTML.includes('EARTHLINE 16785'));
    if(!marker)throw new Error('live product does not contain EARTHLINE 16785 marker');
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      if(!i||!b)throw new Error('search controls unavailable');
      i.focus();i.value=q;
      i.dispatchEvent(new Event('input',{bubbles:true}));
      i.dispatchEvent(new Event('change',{bubbles:true}));
      b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
        if(err)return true;
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const audit=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191&&!!audit&&String(audit.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:45000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(750);
  }catch(e){loadError=String(e);}

  let a={};
  if(!loadError){
    a=await page.evaluate(()=>({
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
      generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
      publication:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
      display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
      flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
      boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
      root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
      fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,
      spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),
      lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
    }));
  }

  const slug=query.toLowerCase().replace(/\s+/g,'-');
  try{await page.screenshot({path:`artifacts/mantra46-16785/${slug}.png`,fullPage:false});}catch(_){}

  const row={
    query,loadError,timedOut,elapsedMs:Date.now()-started,
    coreMs:a?.perf?.totalMs??null,
    generated:a?.publication?.generated??null,
    visible:a?.display?.swaleLines??a?.publication?.overlaySwaleLines??null,
    unsafe:a?.flow?.unsafeSegments??null,
    rootPass:a?.root?.pass??null,
    firstFailedStage:a?.root?.firstFailedStage??null,
    repairOwner:a?.root?.repairOwner??null,
    lineage:a?.root?.cellLineage??null,
    rankedCauses:a?.root?.rankedCauses??null,
    opportunityCells:Array.isArray(a?.fine?.opportunityCells)?a.fine.opportunityCells.length:null,
    candidateCells:a?.spread?.candidateCells??null,
    selectedCells:a?.spread?.finalCells??null,
    targetCells:a?.spread?.targetCells??null,
    swaps:a?.spread?.swaps??null,
    boundary:a?.boundary??null,
    lastError:a?.lastError||null,
    pageErrors,
    status:a?.status||''
  };
  results.push(row);
  console.log('EARTHLINE_M46_16785 '+JSON.stringify(row));
  await context.close();
}

await browser.close();
writeFileSync('artifacts/mantra46-16785/results.json',JSON.stringify(results,null,2));

const failed=results.some(r=>
  r.loadError||r.timedOut||r.lastError||r.pageErrors.length||
  Number(r.coreMs)>15000||Number(r.unsafe)!==0||
  Number(r.generated)!==Number(r.visible)
);
if(failed)process.exitCode=1;
