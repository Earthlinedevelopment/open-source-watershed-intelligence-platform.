import {chromium,webkit} from 'playwright';

const REPS=[
  ["const gaps16839=rows16839.filter(r16839=>r16839.valid>=4&&r16839.opp>=3&&(r16839.opp/Math.max(1,r16839.valid))>=.45&&r16839.swales===0),groups16839=new Map();",
   "const gaps16839=rows16839.filter(r16839=>r16839.valid>=4&&r16839.opp>=3&&(r16839.opp/Math.max(1,r16839.valid))>=.18&&r16839.swales===0),groups16839=new Map();"],
  ["for(const cand16839 of arr16839.slice(0,2)){","for(const cand16839 of arr16839.slice(0,3)){"]
];

async function run(browserType,label,q){
  const browser=await browserType.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://earthlinedevelopment.org/',async route=>{
    const response=await route.fetch();let body=await response.text();
    for(const [a,b] of REPS){if(!body.includes(a))throw new Error('candidate owner missing: '+a.slice(0,100));body=body.replace(a,b);}
    await route.fulfill({response,body});
  });
  await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForTimeout(1000);
  await page.locator('#searchInput').fill(q);
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  const t0=Date.now();
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
  },before,{timeout:90000});
  await page.waitForTimeout(300);
  const out=await page.evaluate(t0=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    let maxSlope=-Infinity; for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))maxSlope=Math.max(maxSlope,n);}
    return {
      ms:Date.now()-t0,swales:Number(d?.derived?.swaleOpportunityLines||0),
      rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,
      maxSlope:Number.isFinite(maxSlope)?maxSlope:null,
      supertile:window.EARTHLINE_STATEWIDE_SUPERTILE_16839||null,
      fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,
      gap:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,
      late:window.EARTHLINE_LATE_GAP_REFINEMENT_16741||null,
      coverage:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null
    };
  },t0);
  await browser.close();
  return {label,q,...out,errors};
}
const rows=[];
for(const q of ['Vermont','Arizona']){
  rows.push(await run(chromium,'chromium',q));
  rows.push(await run(webkit,'webkit',q));
}
const failures=[];
for(const r of rows){
  if(!(r.swales>0&&r.rendered>0))failures.push(r.label+' '+r.q+' blank');
  if(r.maxSlope!==null&&r.maxSlope>4)failures.push(r.label+' '+r.q+' slope '+r.maxSlope);
  if(r.coverage&&r.coverage.passed!==true)failures.push(r.label+' '+r.q+' coverage unresolved '+JSON.stringify(r.coverage.unresolved||[]));
  if(r.label==='webkit'&&r.ms>45000)failures.push(r.label+' '+r.q+' slow '+r.ms);
  if(r.errors.length)failures.push(r.label+' '+r.q+' errors '+JSON.stringify(r.errors));
}
console.log('M84_SHARED_LOCAL_REFINEMENT '+JSON.stringify({rows,failures}));
if(failures.length)process.exitCode=2;
