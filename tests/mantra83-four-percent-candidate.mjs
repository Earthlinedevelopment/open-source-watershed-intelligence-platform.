import {chromium} from 'playwright';

const OLD1='const slope=hy.slope[i],acc=hy.acc[i],minSlope=relaxed?.05:.20,maxSlope=relaxed?(focusMode?18:4):13.5;';
const NEW1='const slope=hy.slope[i],acc=hy.acc[i],minSlope=relaxed?.05:.20,maxSlope=4;';
const OLD2="const acceptedChosen=focusMode?auditedCandidates.filter(c=>c.contourAudit16166.valid):auditedCandidates;";
const NEW2="const acceptedChosen=(focusMode?auditedCandidates.filter(c=>c.contourAudit16166.valid):auditedCandidates).filter(c=>Number.isFinite(Number(c.slope))&&Number(c.slope)<=4);";
const OLDJSONP='function cleanup(){try{script.remove()}catch(_){}try{delete window[cb]}catch(_){window[cb]=undefined}}';
const NEWJSONP='function cleanup(){try{script.remove()}catch(_){}try{window[cb]=()=>{};setTimeout(()=>{try{delete window[cb]}catch(_){window[cb]=undefined}},30000)}catch(_){}}';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

await page.route('https://earthlinedevelopment.org/',async route=>{
  const response=await route.fetch();
  let body=await response.text();
  if(!body.includes(OLD1)||!body.includes(OLD2))throw new Error('candidate source owners not found');
  body=body.replace(OLD1,NEW1).replace(OLD2,NEW2);
  if(body.includes(OLDJSONP))body=body.replace(OLDJSONP,NEWJSONP);
  await route.fulfill({response,body});
});

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
  await page.waitForTimeout(1600);
  return await page.evaluate(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    let maxSlope=-Infinity;
    for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))maxSlope=Math.max(maxSlope,n);}
    return {
      query:d?.query||null,
      swales:Number(d?.derived?.swaleOpportunityLines||0),
      rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,
      maxSlopePct:Number.isFinite(maxSlope)?maxSlope:null
    };
  });
}

const out=[];
for(const q of ['Vermont','Arkansas','Iowa','Nebraska','Oklahoma','Colorado','California','Maryland']) out.push(await runQuery(q));
for(const r of out){
  if(!(r.swales>0))throw new Error(r.query+' produced zero swales');
  if(!(r.rendered>0))throw new Error(r.query+' rendered zero swales');
  if(r.maxSlopePct!==null&&r.maxSlopePct>4)throw new Error(r.query+' exceeded 4%: '+r.maxSlopePct);
}
const jsonpErrors=pageErrors.filter(e=>e.includes('__earthlineVtInfra'));
if(jsonpErrors.length)throw new Error('late Vermont JSONP callback still throws');

console.log('M83_FOUR_PERCENT_CANDIDATE_PASS '+JSON.stringify({states:out,pageErrors:pageErrors.slice(0,10)}));
await browser.close();
