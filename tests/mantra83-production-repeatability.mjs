import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(2200);

async function run(q){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill(q);
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
  },before,{timeout:120000});
  await page.waitForTimeout(700);
  return await page.evaluate(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
    const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    let max=-Infinity;
    for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))max=Math.max(max,n);}
    return {
      q:d?.query,swales:Number(d?.derived?.swaleOpportunityLines||0),water:Number(d?.derived?.waterPaths||0),
      contours:Number(d?.derived?.contours||0),maxSlope:Number.isFinite(max)?max:null,
      rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length
    };
  });
}
const rows={};
for(const q of ['Vermont','Arkansas','Iowa']){
  rows[q]=[];
  for(let i=0;i<3;i++)rows[q].push(await run(q));
}
const failures=[];
for(const [q,a] of Object.entries(rows)){
  const sig=a.map(r=>[r.swales,r.water,r.contours,r.maxSlope,r.rendered].join('|'));
  if(new Set(sig).size!==1)failures.push(q+' nondeterministic '+JSON.stringify(sig));
  if(a.some(r=>r.maxSlope>4))failures.push(q+' slope violation');
}
console.log('M83_REPEATABILITY '+JSON.stringify({rows,failures}));
if(failures.length)process.exitCode=2;
await browser.close();
