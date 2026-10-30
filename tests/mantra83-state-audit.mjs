import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(3000);

async function runQuery(q){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill(q);
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
  },before,{timeout:120000});
  await page.waitForTimeout(1800);
  return await page.evaluate(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const a=window.EARTHLINE_STANDARD_AUDIT_16784||window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
    return {
      query:d?.query||null,
      runToken:d?.runToken||null,
      swales:Number(d?.derived?.swaleOpportunityLines||0),
      water:Number(d?.derived?.waterPaths||0),
      contours:Number(d?.derived?.contours||0),
      audit:a?{
        pass:a.pass,
        firstFailedStage:a.firstFailedStage,
        repairOwner:a.repairOwner,
        nextTest:a.nextTest,
        prescribedSolution:a.prescribedSolution,
        cellLineage:a.cellLineage,
        rankedCauses:(a.rankedCauses||[]).slice(0,4)
      }:null,
      rendered:{
        swalePaths:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,
        contourPaths:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="numbered-elevation-contours"] path').length
      }
    };
  });
}

const out=[];
for(const q of ['Arkansas','Iowa']) out.push(await runQuery(q));
console.log('M83_STATE_AUDIT '+JSON.stringify(out));
await browser.close();
