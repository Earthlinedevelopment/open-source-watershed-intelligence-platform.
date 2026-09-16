import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const URL='https://earthlinedevelopment.org/?earthline_regression=tx_renderer_resize_probe_'+Date.now();
const CASES=['Texas','Texas','Texas','Texas','Texas','New York'];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
const results=[];let loadError=null;
try{
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForFunction(()=>typeof window.earthlineRenderRegionalOverlay16020==='function',{timeout:15000});
  await page.evaluate(()=>{
    const original=window.earthlineRenderRegionalOverlay16020;
    if(!original.__earthlineResizeProbe){
      const wrapped=function(data){
        try{const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);map?.resize?.();}catch(_){}
        return original(data);
      };
      wrapped.__earthlineResizeProbe=true;
      window.earthlineRenderRegionalOverlay16020=wrapped;
    }
  });
}catch(e){loadError=String(e);}

for(let run=0;run<CASES.length&&!loadError;run++){
  const query=CASES[run];
  const prevToken=await page.evaluate(()=>window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584?.runToken||window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970?.runToken||null);
  const clickStarted=Date.now();let timedOut=false,terminalAt=0;
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');if(!i||!b)throw new Error('search controls unavailable');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
  try{
    await page.waitForFunction(({q,prev})=>{const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,token=(err&&err.runToken)||(flow&&flow.runToken)||null;if(!token||token===prev)return false;if(err&&err.runToken===token)return true;const m=typeof M!=='undefined'&&M?M:null,status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''),loc=[m?.loc?.name,m?.loc?.fullName].filter(Boolean).join(' '),identity=q.toLowerCase().split(/\s+/).every(w=>loc.toLowerCase().includes(w));return identity&&/screening published\./i.test(status)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;},{q:query,prev:prevToken},{timeout:30000,polling:50});terminalAt=Date.now();
  }catch(_){timedOut=true;terminalAt=Date.now();}
  const after=await page.evaluate(()=>{const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,label=window.EARTHLINE_REGIONAL_CORRIDOR_LABEL_AUDIT_16336||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;return {perf,pub,label,flow,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()};});
  const r={run:run+1,query,clickToTerminalMs:terminalAt-clickStarted,timedOut,coreMs:Number(after?.perf?.totalMs||Infinity),terrainSource:after?.perf?.terrainSource||null,slowestPhase:after?.perf?.slowestPhase||null,phases:after?.perf?.phaseTotalsMs||null,status:after?.status||'',generated:after?.pub?.generated??null,sourceFeatures:after?.pub?.sourceFeatures??null,overlaySwaleLines:after?.pub?.overlaySwaleLines??null,renderedCorridors:after?.label?.renderedCorridors??null,gridW:after?.flow?.gridAudit?.grid?.w??null,gridH:after?.flow?.gridAudit?.grid?.h??null,unsafeSegments:after?.flow?.unsafeSegments??null,lastError:after?.lastError||null,pageErrors:pageErrors.slice(0,20)};
  results.push(r);console.log('EARTHLINE_TX_RESIZE_PROBE '+JSON.stringify(r));
}
await browser.close();
writeFileSync('tx-ny-regression-results.json',JSON.stringify(results,null,2));
const tx=results.filter(r=>r.query==='Texas');
const bad=loadError||results.length!==CASES.length||results.some(r=>r.timedOut||r.lastError||!Number.isFinite(r.coreMs)||r.coreMs>15000||r.clickToTerminalMs>15000||!/screening published\./i.test(r.status)||Number(r.gridW)!==96||Number(r.gridH)!==96||Number(r.unsafeSegments)!==0||(Number(r.generated||0)>0&&Number(r.overlaySwaleLines||0)===0))||new Set(tx.map(r=>r.generated)).size!==1||new Set(tx.map(r=>r.overlaySwaleLines)).size!==1;
if(loadError)console.error('LOAD_ERROR',loadError);
if(bad)process.exitCode=1;
