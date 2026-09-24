import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mantra47-16836-live-production-verify';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1800,height:950}});

let marker=false, markerAttempts=0;
for(let i=0;i<12;i++){
  markerAttempts=i+1;
  const r=await context.request.get(BASE+`?m47_live_marker=${Date.now()}_${i}`,{timeout:30000});
  const body=await r.text();
  if(body.includes('EARTHLINE 16836 - OPPORTUNITY-BALANCED FINAL SELECTION')){marker=true;break;}
  await new Promise(r=>setTimeout(r,10000));
}
if(!marker){console.log('EARTHLINE_M47_16836_LIVE '+JSON.stringify({marker:false,markerAttempts}));await browser.close();process.exit(1);}

const results=[];
for(const state of ['Arkansas','Texas']){
  const page=await context.newPage();const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();
  try{
    await page.goto(BASE+`?m47_live_16836=${encodeURIComponent(state)}_${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(S=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=S;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},state);
    try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return /screening published\./i.test(s)&&!!window.EARTHLINE_OPPORTUNITY_BALANCE_16836;},null,{timeout:65000,polling:100});}catch(_){timedOut=true;}
    await page.waitForTimeout(700);
  }catch(e){loadError=String(e);}
  const audit=loadError||timedOut?null:await page.evaluate(()=>{
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const balance=window.EARTHLINE_OPPORTUNITY_BALANCE_16836||null;
    return {generated:pub?.generated??null,visible:disp?.swaleLines??pub?.overlaySwaleLines??null,unsafe:flow?.unsafeSegments??null,outside:boundary?.outsideAfterClip?.swales??null,coreMs:perf?.totalMs??null,balance};
  });
  const arTargets=state!=='Arkansas'||(['5,2','5,6'].every(cell=>audit?.balance?.rows?.some(r=>r.toCell===cell))&&audit?.balance?.swaps===6);
  const gate=!!audit&&!loadError&&!timedOut&&pageErrors.length===0&&audit.generated===audit.visible&&audit.unsafe===0&&(audit.outside===0||audit.outside==null)&&Number(audit.coreMs)<=15000&&arTargets;
  const result={state,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit,arTargets,gate};results.push(result);
  console.log('EARTHLINE_M47_16836_LIVE '+JSON.stringify(result));
  await page.screenshot({path:`${OUT}/${state.toLowerCase()}.png`,fullPage:false}).catch(()=>{});
  await page.close();
}
const summary={marker,markerAttempts,passed:results.filter(r=>r.gate).length,failed:results.filter(r=>!r.gate).map(r=>r.state),results};
writeFileSync(`${OUT}/summary.json`,JSON.stringify(summary,null,2));
console.log('EARTHLINE_M47_16836_LIVE_SUMMARY '+JSON.stringify(summary));
await browser.close();
if(!marker||results.some(r=>!r.gate))process.exitCode=1;
