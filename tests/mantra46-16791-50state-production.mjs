import { chromium, firefox, webkit } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const DEFAULT_STATES=['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
const STATES=(process.env.STATES||DEFAULT_STATES.join('|')).split('|').map(s=>s.trim()).filter(Boolean);
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const HEADLESS=!/^(0|false|no)$/i.test(String(process.env.HEADLESS||'true'));
const WAIT_MS=Math.max(45000,Number(process.env.WAIT_MS||45000));
const browserType=BROWSER==='firefox'?firefox:BROWSER==='webkit'?webkit:chromium;
const launchOptions={headless:HEADLESS};
if(BROWSER==='chrome')launchOptions.channel='chrome';
if(BROWSER==='edge'||BROWSER==='msedge')launchOptions.channel='msedge';
const VISUAL=new Set(['Iowa','Arkansas','Oklahoma','Nebraska','Vermont','Texas','Florida','Louisiana','California','New York','Maryland','Colorado','Alaska','Hawaii']);
mkdirSync('artifacts/mantra46-16791-50state',{recursive:true});

const browser=await browserType.launch(launchOptions);
const results=[];

for(const query of STATES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();
  const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false; const started=Date.now();

  try{
    await page.goto(BASE+'?earthline_m46_50='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    const marker=await page.evaluate(()=>{const h=document.documentElement.outerHTML;return h.includes('candidateCoverageCellKeys16791')&&h.includes('attainableTargetCells16791')&&h.includes('coarseContourCells16788')&&h.includes('p16783.parent!==add16783.point.parent');});
    if(!marker)throw new Error('live product does not contain EARTHLINE 16791 marker');
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
      },query,{timeout:WAIT_MS,polling:100});
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
    scaleRefined:window.EARTHLINE_SCALE_REFINED_INPUT_16702||null,
    terrainGap:window.EARTHLINE_TERRAIN_GAP_REFINEMENT_16730||null,
    supertile:window.EARTHLINE_STATEWIDE_SUPERTILE_16839||null,
    coverageGap:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,
    lateGap:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null,
    orb:window.EARTHLINE_ORB_RESPONSIVENESS_16245||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
  }));

  if(VISUAL.has(query)){
    const slug=query.toLowerCase().replace(/\s+/g,'-');
    try{await page.screenshot({path:`artifacts/mantra46-16791-50state/${slug}.png`,fullPage:false});}catch(_){}
  }

  const coreMs=a?.perf?.totalMs??null;
  const generated=a?.pub?.generated??null;
  const visible=a?.display?.swaleLines??a?.pub?.overlaySwaleLines??null;
  const unsafe=a?.flow?.unsafeSegments??null;
  const outside=a?.boundary?.outsideAfterClip??null;
  const hardRootFail=Array.isArray(a?.root?.rankedCauses)&&a.root.rankedCauses.some(r=>r.status==='critical'||r.status==='fail');
  const pass=!loadError&&!timedOut&&!a?.lastError&&!pageErrors.length&&Number(coreMs)<=15000&&Number(generated)===Number(visible)&&Number(unsafe)===0&&Number(outside?.swales||0)===0&&!hardRootFail;
  const row={
    query,browser:BROWSER,headless:HEADLESS,pass,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,coreMs,perf:a?.perf||null,generated,visible,unsafe,
    outsideAfterClip:outside,rootPass:a?.root?.pass??null,firstFailedStage:a?.root?.firstFailedStage??null,
    hardRootFail,lineage:a?.root?.cellLineage??null,candidateCells:a?.spread?.candidateCells??null,
    selectedCells:a?.spread?.finalCells??null,targetCells:a?.spread?.targetCells??null,
    refinementSelected:a?.fine?.selected?.length??null,refinementAdded:a?.fine?.added??null,
    refinementTiming:{
      scaleRefinedMs:a?.scaleRefined?.elapsedMs??null,
      terrainGapMs:a?.terrainGap?.elapsedMs??null,
      supertileMs:a?.supertile?.elapsedMs??null,
      fineMs:a?.fine?.elapsedMs??null,
      coverageGapMs:a?.coverageGap?.elapsedMs??null,
      lateGapMs:a?.lateGap?.elapsedMs??null,
      productsBeforeFlowMs:a?.orb?.productsMs??null
    },
    refinementFlags:{
      scaleRefined:a?.scaleRefined||null,
      terrainGap:a?.terrainGap||null,
      supertile:a?.supertile||null,
      fine:a?.fine||null,
      coverageGap:a?.coverageGap||null,
      lateGap:a?.lateGap||null
    },
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
writeFileSync('artifacts/mantra46-16791-50state/results.json',JSON.stringify({summary,results},null,2));
console.log('EARTHLINE_M46_50_SUMMARY '+JSON.stringify({browser:BROWSER,headless:HEADLESS,summary}));
if(summary.fail)process.exitCode=1;
