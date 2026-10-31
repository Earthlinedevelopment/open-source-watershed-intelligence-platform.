import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:900}});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(2200);

async function runArizona(i){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill('Arizona');
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
  },before,{timeout:120000});
  await page.waitForTimeout(1200);
  return await page.evaluate(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||{};
    const sw=(v.swales?.features||[]).map(f=>({
      p:f.properties||{},
      c:f.geometry?.coordinates||[]
    }));
    const sig=sw.map(f=>{
      const p=f.p,c=f.c,mid=c[Math.floor((c.length-1)/2)]||[];
      return [Number(mid[0]||0).toFixed(5),Number(mid[1]||0).toFixed(5),Number(p.slope_pct||0).toFixed(2),Number(p.score||0).toFixed(1)].join(',');
    }).sort();
    const audit=window.EARTHLINE_STANDARD_AUDIT_16784||null;
    const refine=window.EARTHLINE_LATE_GAP_REFINEMENT_16741||window.EARTHLINE_SCALE_REFINED_INPUT_16702||window.EARTHLINE_LOW_RELIEF_REFINEMENT_16730||null;
    return {
      runToken:d?.runToken||null,
      bounds:d?.bounds||v.bounds||null,
      swales:sw.length,
      signature:sig,
      audit:audit?{cellLineage:audit.cellLineage,ranked:audit.rankedCauses?.slice(0,3)}:null,
      refine
    };
  });
}
const runs=[];
for(let i=0;i<5;i++)runs.push(await runArizona(i));
const sigs=runs.map(r=>JSON.stringify(r.signature));
const unique=[...new Set(sigs)].length;
console.log('M83_ARIZONA_ACCURACY '+JSON.stringify({unique,runs}));
if(unique!==1)process.exitCode=2;
await browser.close();
