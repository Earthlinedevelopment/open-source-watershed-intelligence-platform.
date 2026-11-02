import {chromium} from 'playwright';
const site='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1800,height:832}}),page=await ctx.newPage();
const errors=[],bad=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(site))bad.push({status:r.status(),url:r.url()})});
let failure=null;
try{
  await page.goto(site+'?m92_prod_verify='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:15000});
  await page.evaluate(()=>{
    const i=document.getElementById('searchInput');
    i.value='Arizona';i.dispatchEvent(new Event('input',{bubbles:true}));
    i.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('runBtn').click();
  });
  await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
      !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:90000,polling:200});
  await page.waitForTimeout(700);
}catch(e){failure=String(e)}
const snap=await page.evaluate(()=>{
  const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{},pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
  const group=document.querySelector('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"]');
  const paths=[...(group?.querySelectorAll(':scope > path')||[])];
  const black=paths.filter(el=>el.getAttribute('stroke')==='rgba(8,18,13,.96)');
  const huge=black.filter(el=>{const sw=parseFloat(getComputedStyle(el).strokeWidth)||0;
    let len=0;try{len=el.getTotalLength()}catch{}return sw>=10&&len<3});
  const cores=paths.filter(p=>(p.getAttribute('class')||'').includes('earthline-swale-core-16168'));
  return {swales:pub.generated??null,displayed:pub.overlaySwaleLines??null,source:pub.sourceFeatures??null,
     waterPaths:perf.waterPaths??null,coreMs:perf.phaseTotalsMs?.coreTotalMs??null,
     blackDots:huge.length,maxBlackWidth:Math.max(0,...black.map(p=>parseFloat(getComputedStyle(p).strokeWidth)||0)),
     visibleCores:cores.length,fatal:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
});
await browser.close();
const fail=[];
if(failure||errors.length||snap.fatal)fail.push('browser error');
if(bad.length)fail.push('missing site asset');
if(!(snap.swales>0&&snap.displayed===snap.swales&&snap.source===snap.swales&&snap.visibleCores===snap.swales))
  fail.push('scientific source/display disagreement');
if(snap.blackDots||snap.maxBlackWidth>=10)fail.push('black-dot regression');
console.log('M92_PUBLIC_PRODUCTION_VERIFICATION '+JSON.stringify({url:site,pass:!fail.length,fail,snap,errors,bad,failure}));
if(fail.length)process.exitCode=1;
