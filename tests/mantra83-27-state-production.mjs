import {chromium} from 'playwright';

const STATES=[
'Vermont','New York','Massachusetts','Maryland','Colorado','Texas','Florida','Louisiana',
'California','Oklahoma','Iowa','Arkansas','Nebraska','Arizona','Nevada','Alabama',
'Pennsylvania','Ohio','Michigan','Wisconsin','Minnesota','Missouri','Kansas','New Mexico',
'Utah','Oregon','Washington'
];

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(2500);

async function runQuery(q){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill(q);
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
  },before,{timeout:120000});
  await page.waitForTimeout(900);
  return await page.evaluate(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    let maxSlope=-Infinity;
    for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))maxSlope=Math.max(maxSlope,n);}
    const audit=window.EARTHLINE_STANDARD_AUDIT_16784||null;
    return {
      q:d?.query||null,token:d?.runToken||null,
      swales:Number(d?.derived?.swaleOpportunityLines||0),
      water:Number(d?.derived?.waterPaths||0),
      contours:Number(d?.derived?.contours||0),
      maxSlope:Number.isFinite(maxSlope)?maxSlope:null,
      rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,
      auditPass:audit?.pass??null,
      firstFailedStage:audit?.firstFailedStage||null
    };
  });
}

const out=[];
for(const s of STATES){
  try{out.push(await runQuery(s));}
  catch(e){out.push({q:s,error:String(e?.message||e)});}
}
const failures=out.filter(r=>r.error||!(r.swales>0)||!(r.rendered>0)||(r.maxSlope!==null&&r.maxSlope>4));
const jsonpErrors=pageErrors.filter(e=>e.includes('__earthlineVtInfra'));
console.log('M83_27_STATE_PRODUCTION '+JSON.stringify({out,failures,jsonpErrors,pageErrors:pageErrors.slice(0,20)}));
if(failures.length)process.exitCode=2;
if(jsonpErrors.length)process.exitCode=3;
await browser.close();
