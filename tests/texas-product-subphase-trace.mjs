import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch(); let body=await resp.text();
  const ins=(name,needle,repl)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' matches '+n);body=body.replace(needle,repl);};
  ins('init',
    "const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];",
    "const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];const txSwale16660={};window.EARTHLINE_TX_SWALE_PHASE_16660=txSwale16660;let txSwaleMark16660=performance.now();");
  ins('strictEnd',
    "const preferredEligibleCount16539=jurisdictionEligibleCount16539(candidates);",
    "txSwale16660.strictSamplingMs=Math.round(performance.now()-txSwaleMark16660);txSwale16660.strictCandidates=candidates.length;txSwaleMark16660=performance.now();const preferredEligibleCount16539=jurisdictionEligibleCount16539(candidates);txSwale16660.preferredScreenMs=Math.round(performance.now()-txSwaleMark16660);txSwaleMark16660=performance.now();");
  ins('relaxedEnd',
    "const candidatesBeforeJurisdiction16539=candidates.length;",
    "txSwale16660.relaxedSamplingMs=Math.round(performance.now()-txSwaleMark16660);txSwale16660.afterRelaxedCandidates=candidates.length;txSwaleMark16660=performance.now();const candidatesBeforeJurisdiction16539=candidates.length;");
  ins('finalScreenEnd',
    "const jurisdictionEligibleCandidates16539=candidates.length;",
    "txSwale16660.finalJurisdictionScreenMs=Math.round(performance.now()-txSwaleMark16660);txSwale16660.rejected=jurisdictionRejectedCandidates16539;txSwaleMark16660=performance.now();const jurisdictionEligibleCandidates16539=candidates.length;");
  ins('rankingEnd',
    "const contourToleranceM16166=5.0;",
    "txSwale16660.rankSpacingMs=Math.round(performance.now()-txSwaleMark16660);txSwale16660.chosen=chosen.length;txSwaleMark16660=performance.now();const contourToleranceM16166=5.0;");
  ins('featuresEnd',
    "const generationAudit={",
    "txSwale16660.auditAndFeatureMs=Math.round(performance.now()-txSwaleMark16660);txSwale16660.features=features.length;txSwale16660.totalMs=Object.entries(txSwale16660).filter(([k,v])=>/Ms$/.test(k)&&Number.isFinite(v)).reduce((s,[k,v])=>s+v,0);const generationAudit={");
  return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_swale_phase='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
for(let repeat=1;repeat<=3;repeat++){
 const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));const started=Date.now();
 await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(300);
 const state=await page.evaluate(()=>({swalePhase:window.EARTHLINE_TX_SWALE_PHASE_16660||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,gen:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
 console.log('EARTHLINE_TX_SWALE_PHASE '+JSON.stringify({repeat,patches,elapsedMs:Date.now()-started,timedOut,state}));
}
await browser.close();
