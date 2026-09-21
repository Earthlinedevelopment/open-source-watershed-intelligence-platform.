import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
const VISUAL=new Set(['Iowa','Arkansas','Oklahoma','Nebraska','Vermont','Texas','Florida','Louisiana','California','New York','Maryland','Colorado','Alaska','Hawaii']);
mkdirSync('artifacts/mantra46-16787-50state',{recursive:true});

const browser=await chromium.launch({headless:true});
const results=[];

for(const query of STATES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();
  const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false; const started=Date.now();

  try{
    await page.goto(BASE+'?earthline_m46_50='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    const marker=await page.evaluate(()=>document.documentElement.outerHTML.includes('EARTHLINE 16787 — EFFICIENT TERRAIN-GAP RECOVERY'));
    if(!marker)throw new Error('live product does not contain EARTHLINE 16787 marker');
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      if(!i||!b)throw new Error('search controls unavailable');
      i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;if(err)return true;
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191&&!!root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:45000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(250);
  }catch(e){loadError=String(e);}

  const a=loadError?{}:await page.evaluate(()=>({
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    land:window.EARTHLINE_LAND_VALIDITY_16584||null,
    boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
    spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,
    fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
  }));

  if(VISUAL.has(query)){
    const slug=query.toLowerCase().replace(/\s+/g,'-');
    try{await page.screenshot({path:`artifacts/mantra46-16787-50state/${slug}.png`,fullPage:false});}catch(_){}
  }

  const coreMs=a?.perf?.totalMs??null;
  const generated=a?.pub?.generated??null;
  const visible=a?.display?.swaleLines??a?.pub?.overlaySwaleLines??null;
  const unsafe=a?.flow?.unsafeSegments??null;
  const outside=a?.boundary?.outsideAfterClip??null;
  const hardRootFail=Array.isArray(a?.root?.rankedCauses)&&a.root.rankedCauses.some(r=>r.status==='critical'||r.status==='fail');
  const pass=!loadError&&!timedOut&&!a?.lastError&&!pageErrors.length&&Number(coreMs)<=15000&&Number(generated)===Number(visible)&&Number(unsafe)===0&&Number(outside?.swales||0)===0&&!hardRootFail;
  const row={
    query,pass,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,coreMs,generated,visible,unsafe,
    outsideAfterClip:outside,rootPass:a?.root?.pass??null,firstFailedStage:a?.root?.firstFailedStage??null,
    hardRootFail,lineage:a?.root?.cellLineage??null,candidateCells:a?.spread?.candidateCells??null,
    selectedCells:a?.spread?.finalCells??null,targetCells:a?.spread?.targetCells??null,
    refinementSelected:a?.fine?.selected?.length??null,refinementAdded:a?.fine?.added??null,
    landAcquisition:a?.land?.acquisitionResult??null,lastError:a?.lastError||null,status:a?.status||''
  };
  results.push(row);
  console.log('EARTHLINE_M46_50 '+JSON.stringify(row));
  await context.close();
}

await browser.close();
const summary={
  total:results.length,pass:results.filter(r=>r.pass).length,fail:results.filter(r=>!r.pass).length,
  failed:results.filter(r=>!r.pass).map(r=>r.query),
  over15:results.filter(r=>Number(r.coreMs)>15000).map(r=>({query:r.query,coreMs:r.coreMs})),
  unsafe:results.filter(r=>Number(r.unsafe)!==0).map(r=>({query:r.query,unsafe:r.unsafe})),
  generatedVisibleMismatch:results.filter(r=>Number(r.generated)!==Number(r.visible)).map(r=>({query:r.query,generated:r.generated,visible:r.visible}))
};
writeFileSync('artifacts/mantra46-16787-50state/results.json',JSON.stringify({summary,results},null,2));
console.log('EARTHLINE_M46_50_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
